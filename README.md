# GitHub Enterprise MCP Server

An MCP (Model Context Protocol) server for integration with GitHub Enterprise API. This server provides an MCP interface to easily access repository information, issues, PRs, and more from GitHub Enterprise in Cursor.

## Key Features

- Retrieve repository list from GitHub Enterprise instances
- Get detailed repository information
- List repository branches
- View file and directory contents
- Access enterprise statistics
- Enhanced error handling and user-friendly response formatting

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Access to a GitHub Enterprise instance
- Personal Access Token (PAT)

### Installation and Setup

1. Set up environment variables:

```bash
# GitHub Enterprise API URL
export GITHUB_ENTERPRISE_URL="https://github.your-company.com/api/v3"

# GitHub Personal Access Token
export GITHUB_TOKEN="your_personal_access_token"
```

2. Install packages:

```bash
npm install
```

3. Build:

```bash
npm run build
```

4. Start the server:

```bash
# STDIO mode (direct integration with Cursor)
npm start

# HTTP mode (for debugging)
node dist/index.js --transport http
```

## Additional Options in HTTP Mode

- `--debug`: Enable debug logging
- `--github-enterprise-url <URL>`: Set GitHub Enterprise API URL
- `--token <TOKEN>`: Set GitHub Personal Access Token

## Available MCP Tools

This MCP server provides the following tools:

| Tool Name | Description | Parameters |
|---|---|---|
| `list-repositories` | Retrieve repository list for a user or organization | `owner`: Username/org name<br>`isOrg`: Whether it's an organization<br>`type`: Repository type<br>`sort`: Sort criteria<br>`page`: Page number<br>`perPage`: Items per page |
| `get-repository` | Get detailed repository information | `owner`: Repository owner<br>`repo`: Repository name |
| `list-branches` | List branches of a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`protected_only`: Whether to show only protected branches<br>`page`: Page number<br>`perPage`: Items per page |
| `get-content` | Retrieve file or directory contents | `owner`: Repository owner<br>`repo`: Repository name<br>`path`: File/directory path<br>`ref`: Branch/commit (optional) |
| `get-license-info` | Get GitHub Enterprise license information | - |
| `get-enterprise-stats` | Get GitHub Enterprise system statistics | - |

## API Improvements

- Flexible API URL configuration (supports various environment variables and command-line arguments)
- Enhanced error handling and timeout management
- User-friendly response formatting and messages

## License

ISC 