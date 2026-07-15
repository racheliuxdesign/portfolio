import svgPaths from "./svg-085n4vulw4";

function Icon() {
  return (
    <div className="absolute left-[6px] size-[16px] top-[6.5px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p2b393280} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3eea2890} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p2bdcbd80} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-[#fe0408] relative rounded-[4px] shrink-0 size-[27px]" data-name="Container">
      <Icon />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[201px]" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#41425a] text-[12px] whitespace-nowrap">Data Volume Anomaly</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="bg-[rgba(255,59,87,0.12)] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ec0017] text-[12px] whitespace-nowrap">+32</p>
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex gap-[53px] items-center relative shrink-0">
      <Text />
      <Text1 />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[-0.5px] top-0 w-[175px]">
      <Frame32 />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[18px] relative shrink-0 w-[190px]" data-name="Container">
      <Frame />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[234px]">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Text2() {
  return (
    <div className="bg-[rgba(255,59,87,0.1)] content-stretch flex flex-col items-start px-[7px] py-[2px] relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ec0017] text-[10.5px] whitespace-nowrap">250× baseline</p>
    </div>
  );
}

function TextAlign() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-[89px]" data-name="Text:align">
      <Text2 />
    </div>
  );
}

function Text3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:SemiBold',sans-serif] font-semibold leading-[0] relative shrink-0 text-[#41425a] text-[11.5px] whitespace-nowrap">
        <span className="leading-[normal]">{`50 GB in `}</span>
        <span className="leading-[normal]">44</span>
        <span className="leading-[normal]">{` min`}</span>
      </p>
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#56658a] text-[11.5px] whitespace-nowrap">vs baseline</p>
    </div>
  );
}

function Text5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6c7c9c] text-[11.5px] whitespace-nowrap">~200 MB / day</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Text3 />
      <Text4 />
      <Text5 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[365px]">
      <Frame1 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[387px]">
      <Frame2 />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[598px]">
      <TextAlign />
      <Frame4 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute content-stretch flex gap-[110px] h-[32px] items-center left-0 pl-[4px] pr-[12px] top-[3px] w-[958px]">
      <Frame3 />
      <Frame31 />
    </div>
  );
}

function Button() {
  return (
    <div className="h-[38px] relative shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Frame5 />
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute inset-[22.22%_18.52%_18.52%_22.22%]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p3b632b00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container3() {
  return (
    <div className="bg-[#ff4900] relative rounded-[4px] shrink-0 size-[27px]" data-name="Container">
      <Icon1 />
    </div>
  );
}

function Text6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[201px]" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#41425a] text-[12px] whitespace-nowrap">Off-Hours Access</p>
    </div>
  );
}

function Text7() {
  return (
    <div className="bg-[#ffefe8] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ff4900] text-[12px] whitespace-nowrap">+24</p>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex gap-[53px] items-center relative shrink-0">
      <Text6 />
      <Text7 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[-0.5px] top-0 w-[175px]">
      <Frame33 />
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[18px] relative shrink-0 w-[190px]" data-name="Container">
      <Frame9 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[234px]">
      <Container3 />
      <Container4 />
    </div>
  );
}

function Text8() {
  return (
    <div className="bg-[#ffefe8] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ff4900] text-[10.5px] whitespace-nowrap">Outside 100% of activity</p>
    </div>
  );
}

function TextAlign1() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-[89px]" data-name="Text:align">
      <Text8 />
    </div>
  );
}

function Text9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#41425a] text-[11.5px] whitespace-nowrap">02:03 AM PST</p>
    </div>
  );
}

function Text10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#56658a] text-[11.5px] whitespace-nowrap">vs baseline</p>
    </div>
  );
}

function Text11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6c7c9c] text-[11.5px] whitespace-nowrap">08:00 – 18:00 PST</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Text9 />
      <Text10 />
      <Text11 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[365px]">
      <Frame12 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[387px]">
      <Frame11 />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[598px]">
      <TextAlign1 />
      <Frame10 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="absolute content-stretch flex gap-[110px] h-[32px] items-center left-0 pl-[4px] pr-[12px] top-[3px] w-[958px]">
      <Frame8 />
      <Frame34 />
    </div>
  );
}

function Button1() {
  return (
    <div className="h-[38px] relative shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Frame7 />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-[6px] size-[16px] top-[7px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M9.66667 8.33333L6.33333 5" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M6.33333 8.33333L9.66667 5" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p7ad6800} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 11.3333V14" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M5.33333 14H10.6667" id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[#ff4900] relative rounded-[4px] shrink-0 size-[27px]" data-name="Container">
      <Icon2 />
    </div>
  );
}

function Text12() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[201px]" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#41425a] text-[13.5px] whitespace-nowrap">Unrecognized Device</p>
    </div>
  );
}

function Text13() {
  return (
    <div className="bg-[#ffefe8] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ff4900] text-[12px] whitespace-nowrap">+21</p>
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex gap-[53px] items-center relative shrink-0">
      <Text12 />
      <Text13 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[-0.5px] top-0 w-[175px]">
      <Frame35 />
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[18px] relative shrink-0 w-[190px]" data-name="Container">
      <Frame15 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[234px]">
      <Container5 />
      <Container6 />
    </div>
  );
}

function Text14() {
  return (
    <div className="bg-[rgba(255,239,232,0.1)] relative rounded-[6px] shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[7px] py-[2px] relative size-full">
        <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ff4900] text-[10.5px] whitespace-nowrap">First seen tonight</p>
      </div>
    </div>
  );
}

function TextAlign2() {
  return (
    <div className="bg-[#ffefe8] content-stretch flex items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text:align">
      <Text14 />
    </div>
  );
}

function Text15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#41425a] text-[11.5px] whitespace-nowrap">Unknown device</p>
    </div>
  );
}

function Text16() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#56658a] text-[11.5px] whitespace-nowrap">vs baseline</p>
    </div>
  );
}

function Text17() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6c7c9c] text-[11.5px] whitespace-nowrap">Corp-managed MacBook</p>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Text15 />
      <Text16 />
      <Text17 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[365px]">
      <Frame18 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[387px]">
      <Frame17 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[598px]">
      <TextAlign2 />
      <Frame16 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="absolute content-stretch flex gap-[110px] h-[32px] items-center left-0 pl-[4px] pr-[12px] top-[3px] w-[958px]">
      <Frame14 />
      <Frame36 />
    </div>
  );
}

function Button2() {
  return (
    <div className="h-[38px] relative shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Frame13 />
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[5px] size-[16px] top-[6px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p37f49070} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 5.33333V8" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 10.6667H8.00667" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="bg-[#ff4900] relative rounded-[4px] shrink-0 size-[27px]" data-name="Container">
      <Icon3 />
    </div>
  );
}

function Text18() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[201px]" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#41425a] text-[13.5px] whitespace-nowrap">Sensitive Data Classification</p>
    </div>
  );
}

function Text19() {
  return (
    <div className="bg-[#ffefe8] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ff4900] text-[12px] whitespace-nowrap">+13</p>
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex gap-[53px] items-center relative shrink-0">
      <Text18 />
      <Text19 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[-0.5px] top-0 w-[175px]">
      <Frame37 />
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[18px] relative shrink-0 w-[190px]" data-name="Container">
      <Frame21 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[234px]">
      <Container7 />
      <Container8 />
    </div>
  );
}

function Text20() {
  return (
    <div className="bg-[#ffefe8] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#ff4900] text-[10.5px] whitespace-nowrap">~2.4M records</p>
    </div>
  );
}

function TextAlign3() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-[89px]" data-name="Text:align">
      <Text20 />
    </div>
  );
}

function Text21() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#41425a] text-[11.5px] whitespace-nowrap">Restricted · PII · PCI</p>
    </div>
  );
}

function Text22() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#56658a] text-[11.5px] whitespace-nowrap">vs baseline</p>
    </div>
  );
}

function Text23() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6c7c9c] text-[11.5px] whitespace-nowrap">Internal docs</p>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Text21 />
      <Text22 />
      <Text23 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[365px]">
      <Frame24 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[387px]">
      <Frame23 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[598px]">
      <TextAlign3 />
      <Frame22 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="absolute content-stretch flex gap-[110px] h-[32px] items-center left-0 pl-[4px] pr-[12px] top-[3px] w-[958px]">
      <Frame20 />
      <Frame38 />
    </div>
  );
}

function Button3() {
  return (
    <div className="h-[38px] relative shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Frame19 />
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="absolute left-[6px] size-[16px] top-[6px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p1f466f80} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p17781bc0} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Container9() {
  return (
    <div className="bg-[#ffbf01] relative rounded-[4px] shrink-0 size-[27px]" data-name="Container">
      <Icon4 />
    </div>
  );
}

function Text24() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[201px]" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#41425a] text-[13.5px] whitespace-nowrap">Sensitive Data Classification</p>
    </div>
  );
}

function Text25() {
  return (
    <div className="bg-[#fdf4e4] content-stretch flex flex-col items-start px-[7px] py-px relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#cb7f00] text-[12px] whitespace-nowrap">+5</p>
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex gap-[53px] items-center relative shrink-0">
      <Text24 />
      <Text25 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[-0.5px] top-0 w-[175px]">
      <Frame39 />
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[18px] relative shrink-0 w-[190px]" data-name="Container">
      <Frame27 />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[234px]">
      <Container9 />
      <Container10 />
    </div>
  );
}

function Text26() {
  return (
    <div className="bg-[#fdf6ea] content-stretch flex flex-col items-start px-[7px] py-[2px] relative rounded-[6px] shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#cb7f00] text-[10.5px] whitespace-nowrap">Off-network</p>
    </div>
  );
}

function TextAlign4() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-[89px]" data-name="Text:align">
      <Text26 />
    </div>
  );
}

function Text27() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#41425a] text-[11.5px] whitespace-nowrap">Beijing, China</p>
    </div>
  );
}

function Text28() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#56658a] text-[11.5px] whitespace-nowrap">vs baseline</p>
    </div>
  );
}

function Text29() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <p className="[word-break:break-word] font-['Heebo:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6c7c9c] text-[11.5px] whitespace-nowrap">Corp VPN · SF office</p>
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Text27 />
      <Text28 />
      <Text29 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-[365px]">
      <Frame30 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[387px]">
      <Frame29 />
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-[598px]">
      <TextAlign4 />
      <Frame28 />
    </div>
  );
}

function Frame25() {
  return (
    <div className="absolute content-stretch flex gap-[110px] h-[32px] items-center left-0 pl-[4px] pr-[12px] top-[3px] w-[958px]">
      <Frame26 />
      <Frame40 />
    </div>
  );
}

function Button4() {
  return (
    <div className="h-[38px] relative shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Frame25 />
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] items-start left-0 top-0 w-[927px]">
      <div className="bg-[rgba(255,255,255,0.03)] h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Container">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-px relative rounded-[inherit] size-full">
          <Button />
        </div>
        <div aria-hidden className="absolute border border-[rgba(148,163,199,0.12)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      </div>
      <div className="bg-[rgba(255,255,255,0.03)] h-[36px] relative rounded-[6px] shrink-0 w-[927px]" data-name="Container">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-px relative rounded-[inherit] size-full">
          <Button1 />
        </div>
        <div aria-hidden className="absolute border border-[rgba(148,163,199,0.12)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      </div>
      <div className="bg-[rgba(255,255,255,0.03)] h-[36px] relative rounded-[6px] shrink-0 w-[927px]" data-name="Container">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-px relative rounded-[inherit] size-full">
          <Button2 />
        </div>
        <div aria-hidden className="absolute border border-[rgba(148,163,199,0.12)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      </div>
      <div className="bg-[rgba(255,255,255,0.03)] h-[36px] relative rounded-[6px] shrink-0 w-[927px]" data-name="Container">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-px relative rounded-[inherit] size-full">
          <Button3 />
        </div>
        <div aria-hidden className="absolute border border-[rgba(148,163,199,0.12)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      </div>
      <div className="bg-[rgba(255,255,255,0.03)] h-[36px] relative rounded-[6px] shrink-0 w-[927px]" data-name="Container">
        <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-px relative rounded-[inherit] size-full">
          <Button4 />
        </div>
        <div aria-hidden className="absolute border border-[rgba(148,163,199,0.12)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p1674e600} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M5.33333 4H10.6667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M10.6667 9.33333V12" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M10.6667 6.66667H10.6733" id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M8 6.66667H8.00667" id="Vector_5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M5.33333 6.66667H5.34" id="Vector_6" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M8 9.33333H8.00667" id="Vector_7" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M5.33333 9.33333H5.34" id="Vector_8" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M8 12H8.00667" id="Vector_9" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
          <path d="M5.33333 12H5.34" id="Vector_10" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.04167" />
        </g>
      </svg>
    </div>
  );
}

function Text30() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">
        <Icon5 />
        <p className="[word-break:break-word] font-['Heebo:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[16px] text-white whitespace-nowrap">behavioral risk</p>
      </div>
    </div>
  );
}

function Text31() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[0] relative shrink-0 text-[#ff3b57] text-[0px] tracking-[1px] whitespace-nowrap">
          <span className="leading-[100.0250015258789%] text-[20px] text-white">95</span>
          <span className="leading-[100.0250015258789%] text-[12px] text-white">/100</span>
        </p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex h-[58px] items-center justify-between left-[-1px] px-[15px] py-[12px] rounded-[6px] top-[219px] w-[927px]" style={{ backgroundImage: "linear-gradient(93.5415deg, rgb(255, 2, 2) 3.0928%, rgb(204, 0, 0) 10.684%, rgb(0, 0, 0) 100.05%)" }} data-name="Container">
      <Text30 />
      <Text31 />
    </div>
  );
}

function Container() {
  return (
    <div className="h-[277px] relative shrink-0 w-full" data-name="Container">
      <Frame6 />
      <Container11 />
    </div>
  );
}

export default function ContainerMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[14px] px-[12px] relative size-full" data-name="Container:margin">
      <Container />
    </div>
  );
}