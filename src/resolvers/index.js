import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Post, Comment } from '../models';
import { isAuthenticated, isAdmin, isModerator } from '../context';
import { GraphQLError } from 'graphql';

const CACHE_TTL = 3600; // 1 hour in seconds

export const resolvers = {
    Query: {
        me: isAuthenticated((_, __, { user }) => user),
        
        user: async (_, { id }, { loaders }) => {
            return loaders.user.load(id);
        },
        
        users: async (_, { skip = 0, limit = 10 }) => {
            return User.find().skip(skip).limit(limit);
        },
        
        post: async (_, { id }, { redis }) => {
            // Check cache first
            const cached = await redis.get(`post:${id}`);
            if (cached) return JSON.parse(cached);
            
            const post = await Post.findById(id);
            if (!post) throw new GraphQLError('Post not found');
            
            // Cache the result
            await redis.setex(`post:${id}`, CACHE_TTL, JSON.stringify(post));
            return post;
        },
        
        posts: async (_, { skip = 0, limit = 10 }) => {
            return Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        },
        
        comments: async (_, { postId, skip = 0, limit = 10 }) => {
            return Comment.find({ post: postId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
        },
    },

    Mutation: {
        register: async (_, { email, password, username }) => {
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                throw new GraphQLError('User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                email,
                password: hashedPassword,
                username,
            });

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            });

            return { token, user };
        },

        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new GraphQLError('Invalid credentials');
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                throw new GraphQLError('Invalid credentials');
            }

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            });

            return { token, user };
        },

        createPost: isAuthenticated(async (_, { title, content }, { user, pubsub, redis }) => {
            const post = await Post.create({
                title,
                content,
                author: user.id,
            });

            // Clear cached posts
            await redis.del('posts:latest');

            // Publish subscription event
            pubsub.publish('POST_CREATED', { postCreated: post });

            return post;
        }),

        updatePost: isAuthenticated(async (_, { id, title, content }, { user, redis }) => {
            const post = await Post.findById(id);
            if (!post) throw new GraphQLError('Post not found');
            
            if (post.author.toString() !== user.id && user.role !== 'ADMIN') {
                throw new GraphQLError('Not authorized');
            }

            const updatedPost = await Post.findByIdAndUpdate(
                id,
                { 
                    title: title || post.title,
                    content: content || post.content,
                    updatedAt: new Date(),
                },
                { new: true }
            );

            // Clear cache
            await redis.del(`post:${id}`);

            return updatedPost;
        }),

        deletePost: isAuthenticated(async (_, { id }, { user, redis }) => {
            const post = await Post.findById(id);
            if (!post) throw new GraphQLError('Post not found');
            
            if (post.author.toString() !== user.id && user.role !== 'ADMIN') {
                throw new GraphQLError('Not authorized');
            }

            await Post.findByIdAndDelete(id);
            await Comment.deleteMany({ post: id });

            // Clear cache
            await redis.del(`post:${id}`);

            return true;
        }),

        createComment: isAuthenticated(async (_, { postId, content }, { user, pubsub }) => {
            const post = await Post.findById(postId);
            if (!post) throw new GraphQLError('Post not found');
    
            const comment = await Comment.create({
                content,
                author: user.id,
                post: postId,
            });
    
            // Publish subscription event
            pubsub.publish('COMMENT_ADDED', { 
                commentAdded: comment,
                postId,
            });
    
            return comment;
        }),
    
        updateComment: isAuthenticated(async (_, { id, content }, { user }) => {
            const comment = await Comment.findById(id);
            if (!comment) throw new GraphQLError('Comment not found');
            
            if (comment.author.toString() !== user.id && user.role !== 'ADMIN') {
                throw new GraphQLError('Not authorized');
            }
    
            return Comment.findByIdAndUpdate(
                id,
                { 
                    content,
                    updatedAt: new Date(),
                },
                { new: true }
            );
        }),
    
        deleteComment: isAuthenticated(async (_, { id }, { user }) => {
            const comment = await Comment.findById(id);
            if (!comment) throw new GraphQLError('Comment not found');
            
            if (comment.author.toString() !== user.id && user.role !== 'ADMIN') {
                throw new GraphQLError('Not authorized');
            }
    
            await Comment.findByIdAndDelete(id);
            return true;
        }),
    },
  
    Subscription: {
        postCreated: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['POST_CREATED']),
        },
        commentAdded: {
            subscribe: (_, { postId }, { pubsub }) => 
            pubsub.asyncIterator([`COMMENT_ADDED`]),
            resolve: (payload) => {
                return payload.commentAdded;
            },
        },
    },
  
    User: {
        posts: async (user) => {
            return Post.find({ author: user.id });
        },
        comments: async (user) => {
            return Comment.find({ author: user.id });
        },
    },
  
    Post: {
        author: async (post, _, { loaders }) => {
            return loaders.user.load(post.author);
        },
        comments: async (post) => {
            return Comment.find({ post: post.id });
        },
    },
  
    Comment: {
        author: async (comment, _, { loaders }) => {
            return loaders.user.load(comment.author);
        },
        post: async (comment) => {
            return Post.findById(comment.post);
        },
    },
};