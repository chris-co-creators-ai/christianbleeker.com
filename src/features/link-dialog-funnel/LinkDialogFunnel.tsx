'use client';

/**
 * Link Dialog Funnel — React client-wrapper
 * ==========================================
 * Dunne wrapper rond de vanilla `link-dialog-funnel.js`-module: hij mount `init()` op een
 * container-ref en ruimt netjes op met `destroy()` bij unmount. Alle funnel-logica leeft in
 * het vanilla-bestand; deze component regelt alleen de React-levenscyclus.
 *
 * Bruikbaar in Next.js App Router (client component, vandaar 'use client' hierboven).
 *
 * Eigen implementatie.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { init } from './link-dialog-funnel.js';

export interface LinkDialogFunnelInterest {
  id: string;
  label: string;
}

export interface LinkDialogFunnelChoiceOption {
  id: string;
  label: string;
}

export interface LinkDialogFunnelFieldDef {
  name: string;
  type?: 'text' | 'email' | 'date' | 'textarea' | 'choice';
  label: string;
  required?: boolean;
  /** Veld-specifieke foutmelding; anders valt terug op texts.requiredError. */
  requiredError?: string;
  placeholder?: string;
  autoComplete?: string;
  /** Alleen voor type "choice". */
  options?: LinkDialogFunnelChoiceOption[];
  /** Alleen tonen/verplichten voor deze interesse-id's (contactvelden). */
  onlyFor?: string[];
}

export interface LinkDialogFunnelExtraStep {
  heading: string;
  fields: LinkDialogFunnelFieldDef[];
}

export interface LinkDialogFunnelTexts {
  heading?: string;
  interestLegend?: string;
  progress?: string;
  next?: string;
  back?: string;
  submit?: string;
  submitting?: string;
  close?: string;
  successTitle?: string;
  successBody?: string;
  errorTitle?: string;
  errorBody?: string;
  privacyText?: string;
  privacyLinkLabel?: string;
  requiredError?: string;
  emailError?: string;
  chooseInterestError?: string;
}

export interface LinkDialogFunnelSubmitData {
  interesse: string;
  [veld: string]: string;
}

export interface LinkDialogFunnelProps {
  /** Links binnen deze subtree worden onderschept. Standaard: alles onder de wrapper. */
  children?: ReactNode;
  /** Welke links de dialoog openen. Standaard: href bevat "aanvraag" of "interesse=". */
  linkMatch?: (href: string) => boolean;
  interestParam?: string;
  hashTrigger?: string;
  honeypotName?: string;
  interests?: LinkDialogFunnelInterest[];
  extraSteps?: Record<string, LinkDialogFunnelExtraStep>;
  contactFields?: LinkDialogFunnelFieldDef[];
  texts?: LinkDialogFunnelTexts;
  action?: string;
  privacyHref?: string;
  supportEmail?: string;
  /** async (data) => void | Promise. Als weggelaten en er is een `action`, doet de funnel zelf een fetch(). */
  onSubmit?: (data: LinkDialogFunnelSubmitData) => Promise<void> | void;
  /** Toon "Stap X van Y" bij meer dan 1 stap. Standaard `true` (bestaand gedrag). */
  showStepCount?: boolean;
  /** Toon de privacyregel op élke stap i.p.v. alleen de laatste. Standaard `false`. */
  privacyOnEveryStep?: boolean;
  className?: string;
}

/**
 * Plaats deze component ergens hoog in de boom (bv. in het layout) met de links die je wilt
 * onderscheppen als children, of eromheen. Rendert zelf geen zichtbare opmaak buiten een
 * <div> wrapper — de dialoog wordt door de vanilla-module in <body> gezet.
 */
export function LinkDialogFunnel({
  children,
  className,
  ...options
}: LinkDialogFunnelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const destroy = init(root, options);
    return () => destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init() leest options bij elke mount opnieuw; een deep-compare zou vaker heropbouwen dan nodig.
  }, [
    options.linkMatch,
    options.interestParam,
    options.hashTrigger,
    options.honeypotName,
    options.interests,
    options.extraSteps,
    options.contactFields,
    options.texts,
    options.action,
    options.privacyHref,
    options.supportEmail,
    options.onSubmit,
    options.showStepCount,
    options.privacyOnEveryStep,
  ]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}

export default LinkDialogFunnel;
