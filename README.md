# Neon GPT

A REST API that can be used by a [custom GPT](https://openai.com/blog/introducing-gpts)
to manage resources in your [Neon](https://neon.tech/) account. 

![The Neon GPT working on chat.openai.com](/images/gpt.png)

It currently supports the following features:

* List projects
* List branches & endpoints
* Create a branch with a read-write endpoint
* Execute SQL queries against your database branches

## Usage

The current implementation requires you to supply an API Key from the Neon the
account you'd like to manage using the GPT. The API Key must be set in the 
`NEON_API_KEY` environment variable. 

If you'd like to run this REST API locally for use with GPT, follow the
instructions in the [local development](#local-development) section then
resume following these instructions.

1. Visit the [chat.openai.com/gpts](https://chat.openai.com/gpts)
1. Click **Create** and enter:
    * Name: `My Neon GPT`
    * Description: `A GPT to manage resources in my Neon account`
    * Starters: `List the projects in my Neon account`
1. Run `curl http://localhost:3000/swagger/json | jq > spec.json` to obtain an OpenAPI Spec.
1. Add the following block as a top-level key in the OpenAPI Spec:
    ```js
    "servers": [
        {
            "url": "https://evanshortiss.loca.lt"
        }
    ],
    ```
1. Click **Create new action** at the bottom of the UI and enter:
    * Authentication: `None`
    * Schema: The contents of your _spec.json_.
1. Save your action by clicking **Save** or **Update** and set access to `Invite-only`.

That's it, you can now use your GPT to manage resources in your Neon account!

## Local Development

It's possible to run this REST API locally for testing with GPT. Follow these
steps:

```bash
# Install dependencies
bun install

# Define `NEON_API_KEY` in `.env.local`
cp .env.example .env.local

# Start the server
bun run index.ts
```

In another terminal, start a tunnel to expose the REST API publicly via HTTPS
using [localtunnel](https://github.com/localtunnel/localtunnel):

```bash
bunx localtunnel -s $USER -p 3000
```

This will provide a URL similar to https://your-username.loca.lt. Now follow
the rest of the deployment instructions.

