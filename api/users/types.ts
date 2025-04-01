/**
 * GitHub Enterprise User Management API Type Definitions
 * 
 * This file contains type definitions for the GitHub Enterprise User Management API.
 */

/**
 * User type definition representing a GitHub Enterprise user
 */
export interface User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  hireable?: boolean;
  bio?: string;
  twitter_username?: string;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
  suspended?: boolean;
  private_gists?: number;
  total_private_repos?: number;
  owned_private_repos?: number;
  disk_usage?: number;
  collaborators?: number;
  two_factor_authentication?: boolean;
  plan?: {
    name: string;
    space: number;
    private_repos: number;
    collaborators: number;
  };
}

/**
 * Parameters to list users in GitHub Enterprise
 */
export interface ListUsersParams {
  /**
   * Optional number of results per page (max 100)
   */
  per_page?: number;
  
  /**
   * Optional page number for pagination
   */
  page?: number;
  
  /**
   * Optional parameter to filter users based on their activity
   * - all: Every user, regardless of activity status
   * - active: Only users who are active
   * - suspended: Only users who have been suspended
   */
  filter?: 'all' | 'active' | 'suspended';
  
  /**
   * Optional search query to filter users by username or email
   */
  search?: string;
}

/**
 * Parameters to get a specific user by their username
 */
export interface GetUserParams {
  /**
   * Username of the user to retrieve
   */
  username: string;
}

/**
 * Parameters to create a new enterprise user
 */
export interface CreateUserParams {
  /**
   * The username for the user
   */
  login: string;
  
  /**
   * The email address for the user
   */
  email: string;
  
  /**
   * Optional full name for the user
   */
  name?: string;
  
  /**
   * Optional company for the user
   */
  company?: string;
  
  /**
   * Optional location for the user
   */
  location?: string;
  
  /**
   * Optional biography for the user
   */
  bio?: string;
  
  /**
   * Optional URL of the user's blog or website
   */
  blog?: string;
  
  /**
   * Optional Twitter username for the user
   */
  twitter_username?: string;
}

/**
 * Parameters to update an existing user
 */
export interface UpdateUserParams extends Partial<CreateUserParams> {
  /**
   * Username of the user to update
   */
  username: string;
}

/**
 * Parameters to delete a user
 */
export interface DeleteUserParams {
  /**
   * Username of the user to delete
   */
  username: string;
}

/**
 * Parameters to suspend a user
 */
export interface SuspendUserParams {
  /**
   * Username of the user to suspend
   */
  username: string;
  
  /**
   * Optional reason for the suspension
   */
  reason?: string;
}

/**
 * Parameters to unsuspend a user
 */
export interface UnsuspendUserParams {
  /**
   * Username of the user to unsuspend
   */
  username: string;
}

/**
 * Parameters to list the organizations a user belongs to
 */
export interface ListUserOrgsParams {
  /**
   * Username of the user whose organizations to list
   */
  username: string;
  
  /**
   * Optional number of results per page (max 100)
   */
  per_page?: number;
  
  /**
   * Optional page number for pagination
   */
  page?: number;
}

/**
 * Organization type definition representing a GitHub organization
 */
export interface Organization {
  login: string;
  id: number;
  node_id: string;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string;
} 