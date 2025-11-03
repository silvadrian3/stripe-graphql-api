import client from "./dynamodb-client";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import https from "https";
import {
  AppSyncContext,
  QueryResolvers,
  PostResolvers,
  Todo,
  User,
  Post,
} from "./types";

// Helper function to make HTTPS GET requests
function httpsGet<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse JSON response"));
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function listTodos(): Promise<Todo[]> {
  try {
    const params = {
      TableName: "TodoTable",
    };

    const command = new ScanCommand(params);
    const request = await client.send(command);
    const parseResponse = request.Items?.map((data) => unmarshall(data) as Todo) || [];

    return parseResponse;
  } catch (e) {
    console.error("Error listing todos:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to list todos");
  }
}

async function fetchUsers(): Promise<User[]> {
  try {
    const users = await httpsGet<User[]>("https://jsonplaceholder.typicode.com/users");
    console.log(`Fetched ${users.length} users from JSONPlaceholder`);
    return users;
  } catch (e) {
    console.error("Error fetching users:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to fetch users");
  }
}

async function fetchPosts(): Promise<Post[]> {
  try {
    const posts = await httpsGet<Post[]>("https://jsonplaceholder.typicode.com/posts");
    console.log(`Fetched ${posts.length} posts from JSONPlaceholder`);
    return posts;
  } catch (e) {
    console.error("Error fetching posts:", e);
    throw new Error(e instanceof Error ? e.message : "Failed to fetch posts");
  }
}

async function fetchUserById(userId: number): Promise<User> {
  try {
    const user = await httpsGet<User>(`https://jsonplaceholder.typicode.com/users/${userId}`);
    console.log(`Fetched user ${userId} from JSONPlaceholder`);
    return user;
  } catch (e) {
    console.error(`Error fetching user ${userId}:`, e);
    throw new Error(e instanceof Error ? e.message : `Failed to fetch user ${userId}`);
  }
}

const queryResolvers: QueryResolvers = {
  todos: async (_ctx: AppSyncContext) => {
    return listTodos();
  },
  users: async (_ctx: AppSyncContext) => {
    return fetchUsers();
  },
  posts: async (_ctx: AppSyncContext) => {
    return fetchPosts();
  },
};

const postResolvers: PostResolvers = {
  author: async (ctx: AppSyncContext) => {
    const post = ctx.source as Post;
    if (!post.userId) {
      throw new Error("Post does not have a userId");
    }
    return fetchUserById(post.userId);
  },
};

export const handler = async (ctx: AppSyncContext): Promise<any> => {
  const { parentTypeName, fieldName } = ctx.info;

  console.log("=== Lambda Handler Invoked ===");
  console.log(`Type: ${parentTypeName}, Field: ${fieldName}`);
  console.log(`Context:`, JSON.stringify(ctx, null, 2));

  // Handle Query resolvers
  if (parentTypeName === "Query") {
    console.log(`Routing to Query resolver: ${fieldName}`);
    const resolver = queryResolvers[fieldName as keyof QueryResolvers];
    if (resolver) {
      const result = await resolver(ctx);
      console.log(`Query ${fieldName} completed, returned ${Array.isArray(result) ? result.length : 1} item(s)`);
      return result;
    }
  }

  // Handle Post field resolvers
  if (parentTypeName === "Post") {
    console.log(`Routing to Post field resolver: ${fieldName}`);
    const resolver = postResolvers[fieldName as keyof PostResolvers];
    if (resolver) {
      const result = await resolver(ctx);
      console.log(`Post.${fieldName} completed`);
      return result;
    }
  }

  console.error(`ERROR: Resolver not found for ${parentTypeName}.${fieldName}`);
  throw new Error(`Resolver not found for ${parentTypeName}.${fieldName}`);
};
