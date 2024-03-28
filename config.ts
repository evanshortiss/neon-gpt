import { from } from 'env-var'

export default function getConfig (env: Record<string, string|undefined>) {
  const { get } = from(env)

  return {
    LOCAL: get('LOCAL').default('false').asBool(),
    
    OAUTH_ISSUER: get('OAUTH_ISSUER').default('https://oauth2.neon.tech/.well-known/openid-configuration').asString(),
    OAUTH_CLIENT_ID: get('OAUTH_CLIENT_ID').required().asString(),
    OAUTH_CLIENT_SECRET: get('OAUTH_CLIENT_SECRET').required().asString(),
    OAUTH_REDIRECT_URI: get('OAUTH_REDIRECT_URI').required().asString(),

    NEON_API_URL: get('NEON_API_URL').default('https://api.neon.tech').asString(),
    NEON_API_KEY: get('NEON_API_KEY').required().asString()
  }
}
