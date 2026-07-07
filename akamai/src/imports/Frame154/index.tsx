function Icon() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Icon">
          <path d="M1.5 6.5L4.5 9.5L10.5 2.5" id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="absolute content-stretch flex gap-[5px] items-center left-0 top-0" data-name="Text">
      <Icon />
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#16a34a] text-[12.5px] text-center whitespace-nowrap">False positive</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[15px] relative shrink-0 w-[94px]" data-name="Paragraph">
      <Text />
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center pt-[3px] relative shrink-0" data-name="Button">
      <p className="[text-underline-position:from-font] [word-break:break-word] decoration-from-font decoration-solid font-['Heebo:SemiBold',sans-serif] font-semibold leading-[17.25px] relative shrink-0 text-[#607aff] text-[11.5px] text-center underline whitespace-nowrap">Revert</p>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex gap-[7px] items-center relative size-full">
      <Paragraph />
      <Button />
    </div>
  );
}