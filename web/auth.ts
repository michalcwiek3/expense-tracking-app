import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmail = process.env.AUTH_ALLOWED_EMAIL?.toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email =
        typeof profile?.email === "string" ? profile.email.toLowerCase() : null;

      return !!email && !!allowedEmail && email === allowedEmail;
    },
  },
});
