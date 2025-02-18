import jwt from 'jsonwebtoken';
import { User } from './models';
import DataLoader from 'dataloader';

const batchUsers = async (userIds) => {
    const users = await User.find({ _id: { $in: userIds } });
    return userIds.map(id => users.find(user => user.id === id));
};

export const createContext = async ({ req, redis, pubsub }) => {
    // Create dataloaders
    const loaders = {
        user: new DataLoader(batchUsers),
    };

    // Check for authentication token
    const token = req?.headers?.authorization?.split(' ')[1] || '';
    
    if (!token) {
        return { redis, pubsub, loaders };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        return {
        user,
        redis,
        pubsub,
        loaders,
        };
    } catch (error) {
        return { redis, pubsub, loaders };
    }
};

// Auth middleware
export const isAuthenticated = (next) => (root, args, context, info) => {
    if (!context.user) {
        throw new Error('Authentication required');
    }
    return next(root, args, context, info);
};

export const isAdmin = (next) => (root, args, context, info) => {
    if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Admin access required');
    }
    return next(root, args, context, info);
};

export const isModerator = (next) => (root, args, context, info) => {
    if (!context.user || !['ADMIN', 'MODERATOR'].includes(context.user.role)) {
        throw new Error('Moderator access required');
    }
    return next(root, args, context, info);
};