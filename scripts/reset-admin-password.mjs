import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ENVIRONMENTS = ['production', 'preview', 'development']
const MIN_PASSWORD_LENGTH = 16

function printHelp() {
  console.log(`Reset the Perth Pint Prices admin password.

Usage:
  npm run admin:reset-password

The command stores ADMIN_PASSWORD in Infisical for dev, staging and prod,
updates Vercel Production, Preview and Development, then rebuilds the current
production deployment. It does not deploy files from your working tree.`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

function readSecret(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    fail('Run this command in an interactive terminal.')
  }

  return new Promise((resolve, reject) => {
    let value = ''
    const stdin = process.stdin

    const cleanup = () => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
    }

    const onData = (chunk) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') {
          cleanup()
          process.stdout.write('\n')
          reject(new Error('Password reset cancelled.'))
          return
        }

        if (char === '\r' || char === '\n') {
          cleanup()
          process.stdout.write('\n')
          resolve(value)
          return
        }

        if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1)
          continue
        }

        value += char
      }
    }

    process.stdout.write(prompt)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.on('data', onData)
  })
}

function runVercel(args, options = {}) {
  const result = spawnSync('vercel', ['--no-color', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options,
  })

  if (result.error?.code === 'ENOENT') {
    fail('Vercel CLI is not installed. Install it, then run this command again.')
  }

  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
    fail(output || `Vercel command failed: vercel ${args.join(' ')}`)
  }

  return result
}

function runInfisical(args, options = {}) {
  const result = spawnSync('infisical', ['--silent', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    ...options,
  })

  if (result.error?.code === 'ENOENT') {
    fail('Infisical CLI is not installed. Install it, then run this command again.')
  }

  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
    fail(output || `Infisical command failed: infisical ${args.join(' ')}`)
  }

  return result
}

function updateInfisicalPassword(password) {
  const secretDirectory = mkdtempSync(join(tmpdir(), 'perth-admin-password-'))
  const secretFile = join(secretDirectory, 'admin-password.env')

  try {
    writeFileSync(secretFile, `ADMIN_PASSWORD=${JSON.stringify(password)}\n`, { mode: 0o600 })

    for (const environment of ['dev', 'staging', 'prod']) {
      console.log(`Updating Infisical ${environment}...`)
      runInfisical(['secrets', 'set', '--file', secretFile, '--env', environment, '--path', '/'])
    }
  } finally {
    rmSync(secretDirectory, { recursive: true, force: true })
  }
}

function currentProductionDeploymentId() {
  const result = runVercel(['inspect', 'https://perthpintprices.com'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  const match = output.match(/\bid\s+(dpl_[A-Za-z0-9]+)/)

  if (!match) {
    fail('Could not find the current production deployment in Vercel.')
  }

  return match[1]
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    return
  }

  if (!existsSync('package.json')) {
    fail('Run this command from the Perth Pint Prices project directory.')
  }

  const password = await readSecret('New admin password: ')
  const confirmation = await readSecret('Enter it again: ')

  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  if (password !== password.trim()) {
    fail('Do not start or end the password with spaces.')
  }
  if (password !== confirmation) {
    fail('The passwords did not match.')
  }

  const deploymentId = currentProductionDeploymentId()

  updateInfisicalPassword(password)

  for (const environment of ENVIRONMENTS) {
    console.log(`Updating ${environment}...`)
    runVercel(['env', 'update', 'ADMIN_PASSWORD', environment, '--yes'], {
      input: `${password}\n`,
      stdio: ['pipe', 'inherit', 'inherit'],
    })
  }

  console.log('Rebuilding the current production deployment...')
  runVercel(['redeploy', deploymentId], { stdio: 'inherit' })
  console.log('Admin password reset complete.')
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)))
