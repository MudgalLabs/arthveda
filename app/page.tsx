import { Button } from "@/s8ly";

export default function Home() {
  return (
    <div>
      <h1>Arthveda</h1>
      <div className="flex gap-10">
        <Button>Primary</Button>
        <Button>Secondary</Button>
        <Button>Primary Active</Button>
        <Button>Primary Disabled</Button>
        <Button>Primary Small</Button>
        <Button>Primary Large</Button>
      </div>
    </div>
  );
}
