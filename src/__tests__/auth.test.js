import { createTestClient } from 'apollo-server-testing';
import { gql } from 'graphql-tag';
import { constructTestServer } from '../utils/test-utils';
import { User } from '../models';
import mongoose from 'mongoose';

const REGISTER_USER = gql`
  mutation RegisterUser($email: String!, $password: String!, $username: String!) {
    register(email: $email, password: $password, username: $username) {
      token
      user {
        id
        email
        username
      }
    }
  }
`;

describe('Authentication', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should register a new user', async () => {
    const { mutate } = createTestClient(constructTestServer());

    const res = await mutate({
      mutation: REGISTER_USER,
      variables: {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      },
    });

    expect(res.data.register.user).toHaveProperty('id');
    expect(res.data.register.user.email).toBe('test@example.com');
    expect(res.data.register.user.username).toBe('testuser');
    expect(res.data.register.token).toBeDefined();
  });
});