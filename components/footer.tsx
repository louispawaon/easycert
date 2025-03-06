import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EasyCert. Made with ❤️ by{' '}
        <Link href="https://louispawaon.vercel.app/" className="font-semibold">
          @miggy_pawaon
        </Link>
        <span className="mx-2">|</span>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
} 