import { Elysia, t } from 'elysia'
import { EndpointType, createApiClient } from '@neondatabase/api-client';
import { neon } from '@neondatabase/serverless'
import getConfig from './config';
import swagger from '@elysiajs/swagger';
import pick from 'lodash.pick';

const {
  NEON_API_URL,
  NEON_API_KEY
} = getConfig(process.env);

const neonApiClient = createApiClient({
  url: NEON_API_URL,
  apiKey: NEON_API_KEY,
});

new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Neon API for ChatGPT Plugin',
        version: '1.0.0',
        description: 'This is wrapper for the Neon API to be used with the Neon ChatGPT Plugin.'
      }
    },
    provider: 'swagger-ui'
  }))
  .use((app) => {
    return app.onRequest(({ request }) => {
      console.log(`${request.method} ${request.url}`)
    })
  })
  .get(
    '/projects',
    async ({ headers }) => {
      console.log({ headers })
      const response = await neonApiClient.listProjects({});

      return response.data.projects.map(({ id, name }) => {
        return { id, name }
      })
    },
    {
      response: t.Array(
        t.Object({ id: t.String(), name: t.String() }),
        {
          name: 'Get projects',
          description: 'Returns an array of projects.'
        }
      ),
    }
  )
  .get(
    '/projects/:projectId/branches',
    async ({ params: { projectId } }) => {
      const response = await neonApiClient.listProjectBranches(projectId)

      return response.data.branches.map(({ id, name, primary }) => {
        return { id, name, primary }
      })
    },
    {
      response: t.Array(
        t.Object({ id: t.String(), name: t.String(), primary: t.Boolean() }),
        {
          name: 'Get branches for project by project ID',
          description: 'Returns an array of branches for the given project ID. The response includes the branch ID, name, and a boolean indicating if it\'s the primary branch or not.'
        }
      )
    }
  )
  .get(
    '/projects/:projectId/endpoints',
    async ({ params: { projectId } }) => {
      // tiny-truth-82757244
      // main: br-morning-union-a5fq8xdt
      // ep: ep-white-mountain-a5oyk95h
      // role: neondb_owner
      const response = await neonApiClient.listProjectEndpoints(projectId);
      const data = response.data.endpoints.map((endpoint) => {
        return pick(
          endpoint,
          [
            'created_at',
            'last_active',
            'project_id',
            'autoscaling_limit_max_cu',
            'autoscaling_limit_min_cu',
            'branch_id',
            'id'
          ]
        )
      });

      return data;
    },
    {
      response: t.Array(
        t.Object({
          created_at: t.String(),
          last_active: t.Optional(t.String()),
          project_id: t.String(),
          autoscaling_limit_max_cu: t.Number(),
          autoscaling_limit_min_cu: t.Number(),
          branch_id: t.String(),
          id: t.String()
        }),
        {
          name: 'Get endpoints for project by project ID',
          description: 'Returns an array of endpoints and their associated branches for the given project ID. These endpoints are required to execute SQL queries against a branch.'
        }
      )
    }
  )
  .post(
    '/projects/:projectId/branch',
    async ({ params: { projectId }, body }) => {
      const res = await neonApiClient.createProjectBranch(projectId, {
        branch: {
          parent_id: body.baseBranchId,
          name: body.name
        },
        endpoints: [
          {
            type: EndpointType.ReadWrite
          }
        ]
      })

      if (res.status === 201) {
        return {
          branch: res.data.branch.id,
          endpoint: res.data.endpoints[0].id
        }
      } else {
        throw new Error('Failed to create branch. Neon API returned an error.')
      }
    },
    {
      body: t.Object({
        name: t.String(),
        baseBranchId: t.String()
      }),
      response: t.Object(
        {
          branch: t.String(),
          endpoint: t.String()
        },
        {
          name: 'Create Branch',
          description: 'Creates a database branch with the name given, from the specified base branch ID.' 
        }
      )
    }
  )
  .post(
    '/projects/:projectId/sql',
    async ({ params: { projectId }, body }) => {
      console.log(JSON.stringify(body, null, 2))
      console.log(`SQL for project ${ projectId }`)
      
      const { branchId, endpointId, databaseName = 'neondb', roleName = 'neondb_owner', sql } = body;
      const url = `https://console.neon.tech/api/v2/projects/${projectId}/connection_uri?branch_id=${branchId}&endpoint_id=${endpointId}&database_name=${databaseName}&role_name=${roleName}&pooled=true`
      console.log('Fetching connection URI', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${NEON_API_KEY}`
        }
      });

      if (response.status === 200) {
        const { uri } = await response.json() as { uri: string };
        console.log('Connection URI fetched successfully', uri);

        const data = await neon(uri)(sql)
        console.log('SQL query executed successfully', data);
        return data as any
      } else {
        console.error('Failed to fetch connection URI', response.status, response.statusText)
        throw new Error('Failed to fetch connection URI');
      }
    },
    {
      body: t.Object({
        sql: t.String(),
        branchId: t.String(),
        endpointId: t.String(),
        databaseName: t.Optional(t.String()),
        roleName: t.Optional(t.String())
      }),
      response: t.Array(
        t.Object(t.Any()),
        {
          name: 'Execute SQL Query',
          description: 'Executes the given SQL query on the specified endpoint for a branch. The endpoint ID is a required parameter.' 
        }
      ),
    }
  )
  .listen(3000, (err) => {
    console.log('Server is running on port 3000')
  })
