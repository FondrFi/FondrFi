import { useState } from "react"
import { ChevronDown, CircleHelp } from "lucide-react"

const questions = [
  {
    question: "What is FondrFi?",
    answer: "FondrFi is a non-custodial gateway for discovering and interacting with supported crypto, tokenized equity, and real-world asset markets on Robinhood Chain.",
  },
  {
    question: "Can I explore without connecting a wallet?",
    answer: "Yes. Explore is read-only and does not require a wallet connection. You only connect when you are ready to review and sign a transaction.",
  },
  {
    question: "Which network does FondrFi use?",
    answer: "FondrFi is built around Robinhood Chain. Before signing a transaction, always check that your wallet is connected to the expected network.",
  },
  {
    question: "Does FondrFi charge trading fees?",
    answer: "The supported swap experience is designed around zero app trading fees. Network gas, route conditions, slippage, and any third-party protocol costs can still apply and should be reviewed before signing.",
  },
  {
    question: "What does non-custodial mean here?",
    answer: "Your wallet keeps control of your keys and assets. FondrFi does not ask for a seed phrase or private key, and every approval or transaction requires your own wallet confirmation.",
  },
  {
    question: "Is FONDRFI staking live?",
    answer: "Not yet. The Earn page is launch-ready, but FONDRFI and its staking contract remain pre-launch until official verified contract details are available. No staking transaction is sent before then.",
  },
]

export function FAQSection() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)

  return (
    <section id="faq" className="w-full max-w-6xl mx-auto px-4 py-28 scroll-mt-24 md:py-36">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <CircleHelp className="h-3.5 w-3.5" />
            FAQ
          </div>
          <h2 className="max-w-md text-4xl font-display font-semibold leading-[1.06] tracking-tight text-foreground md:text-5xl">
            Questions worth answering before you swap.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
            Clear context for the parts of onchain markets that should never feel ambiguous.
          </p>
        </div>

        <div className="divide-y divide-border/70 rounded-[1.75rem] border border-border/70 bg-secondary/20 px-5 sm:px-7">
          {questions.map((item, index) => {
            const isOpen = openQuestion === index
            const answerId = `faq-answer-${index}`
            return (
              <div key={item.question}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenQuestion(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <span>{item.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                </h3>
                <div id={answerId} role="region" aria-hidden={!isOpen} className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}