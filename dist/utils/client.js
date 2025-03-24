import axios from 'axios';
import { buildApiUrl } from './config.js';
// HTTP error class
export class GitHubError extends Error {
    status;
    data;
    constructor(message, status, data) {
        super(message);
        this.name = 'GitHubError';
        this.status = status;
        this.data = data;
    }
}
/**
 * Client for making GitHub API requests
 */
export class GitHubClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Perform GitHub API request
     */
    async request(path, options = {}) {
        const url = buildApiUrl(this.config, path);
        const method = options.method || 'GET';
        // Process URL parameters
        const urlWithParams = this.addQueryParams(url, options.params);
        // Prepare headers
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': this.config.userAgent,
            ...options.headers || {},
        };
        // Add authorization header if token exists
        if (this.config.token) {
            headers['Authorization'] = `token ${this.config.token}`;
        }
        // Process request body
        let data = options.body;
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            headers['Content-Type'] = 'application/json';
        }
        // Debug logging for requests
        if (this.config.debug) {
            console.log(`[GitHub API] ${method} ${urlWithParams}`);
            console.log(`[GitHub API] Base URL: ${this.config.baseUrl}`);
            if (data)
                console.log(`[GitHub API] Request body: ${JSON.stringify(data)}`);
        }
        // Set timeout
        const timeout = options.timeout || this.config.timeout;
        // Config for axios
        const axiosConfig = {
            method: method.toLowerCase(),
            url: urlWithParams,
            headers,
            data,
            timeout
        };
        // Handle redirect response type
        if (options.responseType === 'redirect') {
            axiosConfig.maxRedirects = 0;
            axiosConfig.validateStatus = (status) => status >= 200 && status < 400;
        }
        else if (options.responseType) {
            axiosConfig.responseType = options.responseType;
        }
        // Execute request
        try {
            const response = await axios(axiosConfig);
            // For redirect responses, return the Location header
            if (options.responseType === 'redirect') {
                if (response.headers.location) {
                    return { url: response.headers.location };
                }
            }
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle timeout errors
                if (error.code === 'ECONNABORTED') {
                    throw new GitHubError(`GitHub API request timeout: Request did not complete within ${timeout}ms.`, 408);
                }
                const status = error.response?.status || 0;
                let errorData = error.response?.data;
                let errorMessage = `GitHub API error: ${status} ${error.message}`;
                // User-friendly messages for specific error codes
                if (status === 401) {
                    errorMessage = 'GitHub API authentication error: Invalid or expired token.';
                }
                else if (status === 403) {
                    errorMessage = 'GitHub API access denied: You do not have permission to perform this action.';
                }
                else if (status === 404) {
                    errorMessage = `GitHub API resource not found: ${path}`;
                }
                else if (status === 422) {
                    errorMessage = 'GitHub API validation error: The request data is invalid.';
                }
                else if (status >= 500) {
                    errorMessage = 'GitHub API server error: Please try again later.';
                }
                throw new GitHubError(errorMessage, status, errorData);
            }
            // Other network errors
            throw new GitHubError(`GitHub API network error: ${error.message}`, 0);
        }
    }
    /**
     * Add query parameters to request URL
     */
    addQueryParams(url, params) {
        if (!params)
            return url;
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        }
        const queryString = queryParams.toString();
        if (!queryString)
            return url;
        return url.includes('?')
            ? `${url}&${queryString}`
            : `${url}?${queryString}`;
    }
    /**
     * GET request helper
     */
    async get(path, options = {}) {
        return this.request(path, { ...options, method: 'GET' });
    }
    /**
     * POST request helper
     */
    async post(path, body, options = {}) {
        return this.request(path, { ...options, method: 'POST', body });
    }
    /**
     * PUT request helper
     */
    async put(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PUT', body });
    }
    /**
     * PATCH request helper
     */
    async patch(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PATCH', body });
    }
    /**
     * DELETE request helper
     */
    async delete(path, options = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }
}
