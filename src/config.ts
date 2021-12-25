const config = {
  port: 3000,
  token: process.env.DISCORD_TOKEN as string,
  existsMessage: 'This track has already been sent in ',
  onlyLinksMessage: 'Only SoundCloud links are allowed.',
}

export default config
