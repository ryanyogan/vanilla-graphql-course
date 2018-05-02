import React from 'react';
import Repository from './Repository';

const Organization = ({ organization, errors, onFetchMoreIssues }) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong.</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }

  return (
    <div>
      <p>
        <strong>Issues from Organization</strong>
        <br />
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository
        onFetchMoreIssues={onFetchMoreIssues}
        repository={organization.repository}
      />
    </div>
  );
};

export default Organization;
