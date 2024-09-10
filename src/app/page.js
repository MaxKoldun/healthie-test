'use client';
import {
  ApolloProvider,
  HttpLink,
  ApolloClient,
  InMemoryCache,
  split,
} from '@apollo/client';
import { Chat } from '@healthie/sdk';
import '@healthie/sdk/dist/styles/index.css';
import { getMainDefinition } from '@apollo/client/utilities';
import * as ActionCable from '@rails/actioncable';
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink';

import { HealthieProvider } from '@healthie/sdk';
import { useState } from 'react';

export default function Home() {
  const [state, setState] = useState(false);

  function handleHideChat() {
    setState(!state);
  }

  const httpLink = new HttpLink({
    uri: 'https://staging-api.gethealthie.com/graphql',
    headers: {
      authorization: 'Basic token',
      authorizationsource: 'API',
    },
  });

  const cable = ActionCable.createConsumer(
    'wss://ws.staging.gethealthie.com/subscriptions?token=token'
  );
  const wsLink = new ActionCableLink({ cable });

  const link = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      if (!('operation' in definition)) {
        return false;
      }

      const { kind, operation } = definition;
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    httpLink
  );

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // custom configuration if needed
          },
        },
      },
    }),
  });

  return (
    <div className="">
      <ApolloProvider client={client}>
        <HealthieProvider userId={'id'}>
          <button
            style={{ border: '1px solid black' }}
            onClick={handleHideChat}
          >
            {state ? 'Updated' : 'Update'}
          </button>
          <br />
          <div
            style={{
              height: '1000px',
            }}
          >
            <Chat conversationId="id" />
          </div>
        </HealthieProvider>
      </ApolloProvider>
    </div>
  );
}
