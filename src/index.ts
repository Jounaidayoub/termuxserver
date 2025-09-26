import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { exec } from 'child_process'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello this server that wil run commands on the shell , send commands as json and u will recive the resutl')
})

interface CommandRequest {
  cmd: string
  args?: string[]
}

app.post('/run', async (c) => {
  try {
    const { cmd, args }: CommandRequest = await c.req.json()
    if (!cmd) {
      return c.json({ error: 'Command not provided' }, 400)
    }

    const fullCommand = (args && args.length > 0 ) ? `${cmd} ${args.join(' ')}` : cmd
    console.log(`Executing command: ${fullCommand}`)
    const result = await new Promise((resolve, reject) => {
      exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }
        if (stderr) {
          reject(new Error(stderr))
          return
        }
        resolve(stdout)
      })
    })

    return c.json({ result })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return c.json({ error: errorMessage }, 500)
  }
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
