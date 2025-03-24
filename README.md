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

| Tool Name | Description | Parameters | Required PAT Permissions |
|---|---|---|---|
| `list-repositories` | Retrieve repository list for a user or organization | `owner`: Username/org name<br>`isOrg`: Whether it's an organization<br>`type`: Repository type<br>`sort`: Sort criteria<br>`page`: Page number<br>`perPage`: Items per page | `repo` |
| `get-repository` | Get detailed repository information | `owner`: Repository owner<br>`repo`: Repository name | `repo` |
| `list-branches` | List branches of a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`protected_only`: Whether to show only protected branches<br>`page`: Page number<br>`perPage`: Items per page | `repo` |
| `get-content` | Retrieve file or directory contents | `owner`: Repository owner<br>`repo`: Repository name<br>`path`: File/directory path<br>`ref`: Branch/commit (optional) | `repo` |
| `list-pull-requests` | List pull requests in a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`state`: PR state filter<br>`sort`: Sort criteria<br>`direction`: Sort direction<br>`page`: Page number<br>`per_page`: Items per page | `repo` |
| `get-pull-request` | Get pull request details | `owner`: Repository owner<br>`repo`: Repository name<br>`pull_number`: Pull request number | `repo` |
| `create-pull-request` | Create a new pull request | `owner`: Repository owner<br>`repo`: Repository name<br>`title`: PR title<br>`head`: Head branch<br>`base`: Base branch<br>`body`: PR description<br>`draft`: Create as draft PR | `repo` |
| `merge-pull-request` | Merge a pull request | `owner`: Repository owner<br>`repo`: Repository name<br>`pull_number`: Pull request number<br>`merge_method`: Merge method<br>`commit_title`: Commit title<br>`commit_message`: Commit message | `repo` |
| `list-issues` | List issues in a repository | `owner`: Repository owner<br>`repo`: Repository name<br>`state`: Issue state filter<br>`sort`: Sort criteria<br>`direction`: Sort direction<br>`page`: Page number<br>`per_page`: Items per page | `repo` |
| `get-issue` | Get issue details | `owner`: Repository owner<br>`repo`: Repository name<br>`issue_number`: Issue number | `repo` |
| `create-issue` | Create a new issue | `owner`: Repository owner<br>`repo`: Repository name<br>`title`: Issue title<br>`body`: Issue body content<br>`labels`: Array of label names<br>`assignees`: Array of user logins<br>`milestone`: Milestone ID | `repo` |
| `get-license-info` | Get GitHub Enterprise license information **(Requires Classic PAT)** | - | `admin:enterprise` |
| `get-enterprise-stats` | Get GitHub Enterprise system statistics **(Requires Classic PAT)** | - | `admin:enterprise` |

> **Note**: For Enterprise-specific tools (`get-license-info` and `get-enterprise-stats`), a **Classic Personal Access Token** with `admin:enterprise` scope is required. Fine-grained tokens do not support these Enterprise-level permissions.

## API Improvements

- Flexible API URL configuration (supports various environment variables and command-line arguments)
- Enhanced error handling and timeout management
- User-friendly response formatting and messages

## License

ISC 