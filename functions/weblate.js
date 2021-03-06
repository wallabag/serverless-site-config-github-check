import { client } from 'octonode'
import { validateWebhook } from './utils/github'

export async function weblate(event, context, callback) {
  const githubClient = client(process.env.GITHUB_TOKEN)

  const body = JSON.parse(event.body)

  // when creating the webhook
  if (body && ('hook' in body)) {
    let response

    try {
      const message = validateWebhook(body)

      console.log(message)

      response = {
        statusCode: 200,
        body: message,
      }
    } catch (e) {
      console.log(e.message)

      response = {
        statusCode: 500,
        body: e.message,
      }
    }

    return callback(null, response)
  }

  if (!(body && ('pull_request' in body))) {
    return callback(null, {
      statusCode: 500,
      body: 'Event is not a Pull Request',
    })
  }

  console.log(`Working on repo ${body.repository.full_name} for PR #${body.pull_request.number}`)

  if (body.pull_request.user.login !== 'weblate' || body.sender.login !== 'weblate') {
    return callback(null, {
      statusCode: 204,
      body: 'PR is not from Weblate',
    })
  }

  await githubClient
    .issue(body.repository.full_name, body.pull_request.number)
    .addLabelsAsync(['Translations'])

  console.log('Labelled!')

  return callback(null, {
    statusCode: 204,
    body: 'Process finished',
  })
}
