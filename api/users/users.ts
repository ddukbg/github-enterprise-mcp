/**
 * GitHub Enterprise User Management API
 * 
 * This file contains the implementation of the GitHub Enterprise User Management API.
 * It provides functionality for managing users in a GitHub Enterprise environment.
 */

import axios from 'axios';
import { 
  User, 
  ListUsersParams, 
  GetUserParams, 
  CreateUserParams, 
  UpdateUserParams, 
  DeleteUserParams, 
  SuspendUserParams, 
  UnsuspendUserParams,
  ListUserOrgsParams,
  Organization 
} from './types.js';

/**
 * User Management API Class
 * 
 * Provides methods for managing users in GitHub Enterprise
 */
export class UserManagement {
  /**
   * List all users in the GitHub Enterprise instance
   * 
   * @param client - GitHub API client
   * @param params - Parameters for listing users
   * @returns Promise that resolves to an array of User objects
   */
  async listUsers(client: any, params?: ListUsersParams): Promise<User[]> {
    try {
      const { baseUrl, token } = client;
      
      if (!baseUrl) {
        throw new Error('GitHub Enterprise URL is not set');
      }
      
      if (!token) {
        throw new Error('GitHub token is not set');
      }
      
      const queryParams = new URLSearchParams();
      
      if (params?.per_page) {
        queryParams.append('per_page', params.per_page.toString());
      }
      
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      
      if (params?.filter) {
        queryParams.append('filter', params.filter);
      }
      
      if (params?.search) {
        queryParams.append('q', params.search);
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // For GitHub Enterprise, we use the admin API endpoint for user management
      // This endpoint is only available to site administrators
      const url = `${baseUrl}/admin/users${queryString}`;
      
      console.log('Requesting users from URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User listing endpoint not found. Make sure you have admin permissions and are using GitHub Enterprise.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. This endpoint requires site administrator permissions.');
      }
      
      if (error.response) {
        throw new Error(`Failed to list users: ${error.response.status} ${error.response.statusText}`);
      }
      
      throw new Error(`Failed to list users: ${error.message}`);
    }
  }
  
  /**
   * Get a specific user by username
   * 
   * @param client - GitHub API client
   * @param params - Parameters with username
   * @returns Promise that resolves to a User object
   */
  async getUser(client: any, params: GetUserParams): Promise<User> {
    try {
      const { baseUrl, token } = client;
      const { username } = params;
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      const url = `${baseUrl}/users/${username}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User '${params.username}' not found`);
      }
      
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
  
  /**
   * Create a new user in GitHub Enterprise
   * Note: This is only available in GitHub Enterprise
   * 
   * @param client - GitHub API client
   * @param params - Parameters for creating a user
   * @returns Promise that resolves to the created User object
   */
  async createUser(client: any, params: CreateUserParams): Promise<User> {
    try {
      const { baseUrl, token } = client;
      
      if (!params.login || !params.email) {
        throw new Error('Username (login) and email are required');
      }
      
      const url = `${baseUrl}/admin/users`;
      
      const response = await axios.post(url, params, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User creation endpoint not found. Make sure you have admin permissions and are using GitHub Enterprise.');
      } else if (error.response?.status === 422) {
        throw new Error(`Validation failed: ${error.response.data.message || 'Check the username and email format'}`);
      }
      
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
  
  /**
   * Update an existing user in GitHub Enterprise
   * 
   * @param client - GitHub API client
   * @param params - Parameters for updating a user
   * @returns Promise that resolves to the updated User object
   */
  async updateUser(client: any, params: UpdateUserParams): Promise<User> {
    try {
      const { baseUrl, token } = client;
      const { username, ...userData } = params;
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      const url = `${baseUrl}/admin/users/${username}`;
      
      const response = await axios.patch(url, userData, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User '${params.username}' not found or admin endpoint not available`);
      } else if (error.response?.status === 422) {
        throw new Error(`Validation failed: ${error.response.data.message || 'Check the provided data format'}`);
      }
      
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
  
  /**
   * Delete a user from GitHub Enterprise
   * 
   * @param client - GitHub API client
   * @param params - Parameters with username to delete
   * @returns Promise that resolves to true if successful
   */
  async deleteUser(client: any, params: DeleteUserParams): Promise<boolean> {
    try {
      const { baseUrl, token } = client;
      const { username } = params;
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      const url = `${baseUrl}/admin/users/${username}`;
      
      await axios.delete(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User '${params.username}' not found or admin endpoint not available`);
      }
      
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
  
  /**
   * Suspend a user in GitHub Enterprise
   * 
   * @param client - GitHub API client
   * @param params - Parameters with username to suspend
   * @returns Promise that resolves to true if successful
   */
  async suspendUser(client: any, params: SuspendUserParams): Promise<boolean> {
    try {
      const { baseUrl, token } = client;
      const { username, reason } = params;
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      const url = `${baseUrl}/admin/users/${username}/suspended`;
      
      // If a reason is provided, include it in the request body
      const data = reason ? { reason } : {};
      
      await axios.put(url, data, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      });
      
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User '${params.username}' not found or admin endpoint not available`);
      }
      
      throw new Error(`Failed to suspend user: ${error.message}`);
    }
  }
  
  /**
   * Unsuspend a user in GitHub Enterprise
   * 
   * @param client - GitHub API client
   * @param params - Parameters with username to unsuspend
   * @returns Promise that resolves to true if successful
   */
  async unsuspendUser(client: any, params: UnsuspendUserParams): Promise<boolean> {
    try {
      const { baseUrl, token } = client;
      const { username } = params;
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      const url = `${baseUrl}/admin/users/${username}/suspended`;
      
      await axios.delete(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User '${params.username}' not found or admin endpoint not available`);
      }
      
      throw new Error(`Failed to unsuspend user: ${error.message}`);
    }
  }
  
  /**
   * List organizations a user belongs to
   * 
   * @param client - GitHub API client
   * @param params - Parameters with username and pagination options
   * @returns Promise that resolves to an array of Organization objects
   */
  async listUserOrganizations(client: any, params: ListUserOrgsParams): Promise<Organization[]> {
    try {
      const { baseUrl, token } = client;
      const { username, per_page, page } = params;
      
      if (!username) {
        throw new Error('Username is required');
      }
      
      const queryParams = new URLSearchParams();
      
      if (per_page) {
        queryParams.append('per_page', per_page.toString());
      }
      
      if (page) {
        queryParams.append('page', page.toString());
      }
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const url = `${baseUrl}/users/${username}/orgs${queryString}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User '${params.username}' not found`);
      }
      
      throw new Error(`Failed to list user organizations: ${error.message}`);
    }
  }
} 