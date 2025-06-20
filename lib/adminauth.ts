export async function checkpass(password: string, hashedpass: string) {
  console.log(await hashedPass(password))
  return (await hashedPass(password)) === hashedpass
}

async function hashedPass(password: string) {

  const arrayBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password))

  return Buffer.from(arrayBuffer).toString("base64")
}

