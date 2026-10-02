import Link from "next/link";
import { POLICY } from "../../lib/policy.mjs";
export default function Policy() {
  return (
    <main>
      <nav>
        <Link href="/">← Back to support</Link>
      </nav>
      <section className="card">
        <h1>Refund policy</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{POLICY}</pre>
      </section>
    </main>
  );
}
