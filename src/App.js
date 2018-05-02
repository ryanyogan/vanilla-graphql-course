import React, { Component } from 'react';
import axios from 'axios';
import Organization from './components/Organization';

const TITLE = 'Vanilla GraphQL';

const axiosGithubGrapQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${
      process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN
    }`,
  },
});

const GET_ISSUES_OF_REPO = `
  query ($org: String!, $repo: String!, $cursor: String) {
    organization(login: $org) {
      name
      url
      repository(name: $repo) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const ADD_STAR = `
  mutation addStar($repoId: ID!) {
    addStar(input:{ starrableId: $repoId }) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const getIssuesOfRepo = (path, cursor) => {
  const [org, repo] = path.split('/');

  return axiosGithubGrapQL.post('', {
    query: GET_ISSUES_OF_REPO,
    variables: { org, repo, cursor },
  });
};

const resolveIssuesQuery = (queryResult, cursor) => state => {
  const { data, errors } = queryResult.data;

  if (!cursor) {
    return {
      organization: data.organization,
      errors,
    };
  }

  const { edges: oldIssues } = state.organization.repository.issues;
  const { edges: newIssues } = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        },
      },
    },
    errors,
  };
};

const addStarToRepository = repoId =>
  axiosGithubGrapQL.post('', {
    query: ADD_STAR,
    variables: { repoId },
  });

const resolveAddStarMutation = mutationResult => state => {
  const { viewerHasStarred } = mutationResult.data.data.addStar.starrable;
  const { totalCount } = state.organization.repository.stargazers;

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: totalCount + 1,
        },
      },
    },
  };
};

class App extends Component {
  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null,
  };

  componentDidMount() {
    this.onFetchFromGithub(this.state.path);
  }

  onSubmit = e => {
    e.preventDefault();
    this.onFetchFromGithub(this.state.path);
  };

  onChange = e => this.setState({ [e.target.id]: e.target.value });

  onFetchFromGithub = (path, cursor) =>
    getIssuesOfRepo(path, cursor).then(queryResult =>
      this.setState(resolveIssuesQuery(queryResult, cursor)),
    );

  onFetchMoreIssues = () => {
    const { endCursor } = this.state.organization.repository.issues.pageInfo;
    this.onFetchFromGithub(this.state.path, endCursor);
  };

  onStarRepository = (repoId, viewerHasStarred) =>
    addStarToRepository(repoId).then(mutationResult =>
      this.setState(resolveAddStarMutation(mutationResult)),
    );

  render() {
    const { organization, errors } = this.state;

    return (
      <div className="App">
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">Show open issues for https://github.com</label>
          <br />
          <input
            id="url"
            type="text"
            value={this.state.url}
            onChange={this.onChange}
            style={{ width: '300px' }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />

        {organization ? (
          <Organization
            errors={errors}
            onFetchMoreIssues={this.onFetchMoreIssues}
            onStarRepository={this.onStarRepository}
            organization={organization}
          />
        ) : (
          <p>No information yet...</p>
        )}
      </div>
    );
  }
}

export default App;
