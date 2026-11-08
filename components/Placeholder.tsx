import { PageHeader } from "@/components/nav/PageHeader";

interface Props {
  title: string;
  milestone: number;
  description: string;
  initial: string;
}

export function Placeholder({ title, milestone, description, initial }: Props) {
  return (
    <>
      <PageHeader title={title} initial={initial} />
      <section className="flex flex-col gap-2 rounded-[20px] bg-surface p-[18px]">
        <span className="text-[12px] font-semibold tracking-[0.08em] text-dim uppercase">Coming in milestone {milestone}</span>
        <p className="m-0 text-[15px] text-dim">{description}</p>
      </section>
    </>
  );
}
