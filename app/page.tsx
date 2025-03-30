import { Button, TextInput } from "@/s8ly";

export default function Home() {
  return (
    <div>
      <h1>Arthveda</h1>
      <div className="flex w-full items-baseline justify-center gap-10">
        <input placeholder="enter your name" />
        <TextInput />
        <Button variant="secondary">Button</Button>
        <Button>Button</Button>
      </div>
    </div>
  );
}
