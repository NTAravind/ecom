import NextAuth from "next-auth"
import { verifyOtp } from "./lib/otpstore"
 import Credentials from "next-auth/providers/credentials"
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        phone: {},
        otp: {},
      },
      authorize: async (credentials) => {
        let user = null
 
        // logic to salt and hash password
        if (!credentials || !credentials.phone || !credentials.otp) {
          throw new Error("Phone number and OTP are required.")
        }
 
        // logic to verify if the user exists
        user = await verifyOtp(
          credentials.phone as string,
          credentials.otp as string,
          )
 
        if (!user) {
          // No user found, so this is their first attempt to login
          // Optionally, this is also the place you could do a user registration
          throw new Error("Invalid credentials.")
        }
 
        // return user object with their profile data
        return user
      },
    }),
  ],
})