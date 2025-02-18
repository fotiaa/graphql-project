import { gql } from 'graphql-tag';

export const typeDefs = gql`
    type User {
        id: ID!
        email: String!
        username: String!
        role: UserRole!
        createdAt: String!
        posts: [Post!]
        comments: [Comment!]
    }

    enum UserRole {
        ADMIN
        MODERATOR
        USER
    }

    type Post {
        id: ID!
        title: String!
        content: String!
        author: User!
        comments: [Comment!]
        createdAt: String!
        updatedAt: String!
    }

    type Comment {
        id: ID!
        content: String!
        author: User!
        post: Post!
        createdAt: String!
        updatedAt: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        me: User
        user(id: ID!): User
        users(skip: Int, limit: Int): [User!]!
        post(id: ID!): Post
        posts(skip: Int, limit: Int): [Post!]!
        comments(postId: ID!, skip: Int, limit: Int): [Comment!]!
    }

    type Mutation {
        # Auth mutations
        register(email: String!, password: String!, username: String!): AuthPayload!
        login(email: String!, password: String!): AuthPayload!
        
        # Post mutations
        createPost(title: String!, content: String!): Post!
        updatePost(id: ID!, title: String, content: String): Post!
        deletePost(id: ID!): Boolean!
        
        # Comment mutations
        createComment(postId: ID!, content: String!): Comment!
        updateComment(id: ID!, content: String!): Comment!
        deleteComment(id: ID!): Boolean!
    }

    type Subscription {
        postCreated: Post!
        commentAdded(postId: ID!): Comment!
    }
`;