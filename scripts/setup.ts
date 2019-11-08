#!/usr/bin/env node
import chalk from 'chalk'
import execa = require('execa')

const githubUsername = process.argv.slice(2)

if (!githubUsername) {
	throw new Error('Please provide GitHub username as an argument');
}

const cloning = Promise.all([
  'prisma2',
  'photonjs',
  'lift',
].map(async repo => {
  const clonePath = `${githubUsername}/${repo}`
  const origin = `https://github.com/${clonePath}.git`
  const upstream = `https://github.com/prisma/${repo}.git`

  console.log(chalk.cyan(`Cloning ${clonePath}...`))

  await run('git', ['clone', origin, repo], {
    errorMessage: 'Unable to clone'
  })

  await run('git', ['remote', 'add', 'upstream', upstream], {
    cwd: repo,
    errorMessage: 'Unable to add upstream remote'
  })

  await run('git', ['pull', 'upstream', 'master'], {
    cwd: repo,
    errorMessage: 'Unable to pull upstream master'
  })

  await run('git', ['push', 'origin', 'master:master'], {
    cwd: repo,
    errorMessage: 'Unable to sync master'
  })
}))

setup()

async function setup() {
  try {
    await cloning
  } catch (err) {
    throw err
  }

  console.log(chalk.green('Successfully cloned repos!'))

  await run('lerna', ['bootstrap'], {
    errorMessage: 'Unable to bootstrap'
  })

  // await run('lerna', ['link'], { // minus lift & introspection
  //   errorMessage: 'Unable to link'
  // })

  await run('rm', ['-Rf', 'lift/node_modules', 'prisma2/cli/introspection'], {
    errorMessage: 'Unable to delete lift/node_modules'
  })

  await run('yarn', ['install'], {
    cwd: 'lift',
    errorMessage: 'Unable to install lift'
  })

  await run('yarn', ['install'], {
    cwd: 'prisma2/cli/introspection',
    errorMessage: 'Unable to install introspection'
  })

  // await run('lerna', ['bootstrap'], {
  //   errorMessage: 'Unable to bootstrap'
  // })

  await run('lerna', ['exec', 'yarn', 'build'], {
    errorMessage: 'Unable to build'
  })

  // lerna exec yarn build
  // ink
  // introspection*
  // lift

  // rebuild prisma2

  console.log(chalk.green(`You're all setup!`))
}

async function run(
  cmd: string,
  args?: readonly string[],
  opts?: execa.Options<string> & {
    errorMessage?: string
  }
) {
  try {
    await execa(cmd, args, { stdio: 'inherit', ...opts })
  } catch (err) {
    throw new Error(opts?.errorMessage ?? `Unable to run ${cmd} command`)
  }
}
