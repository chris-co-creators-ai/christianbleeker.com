"use client";

import { useEffect, useRef } from "react";
import type { ElementType, ReactNode } from "react";
import { init } from "./kinetic-type.js";
import "./kinetic-type.css";

export interface KineticTypeOptions {
	/** Media query waaronder x-mode-elementen alsnog langs de y-as meten. */
	xAxisBelow?: string;
	yFactor?: number;
	xFactor?: number;
	minWeight?: number;
	maxWeight?: number;
	maxWidth?: number;
	minWidth?: number;
	minAlpha?: number;
	maxAlpha?: number;
}

export interface KineticTypeProps extends KineticTypeOptions {
	/** Eén of meer <KineticWord>-elementen (of andere content — alleen elementen
	 * met `data-kinetic-type` worden gemeten). */
	children: ReactNode;
	className?: string;
}

/**
 * Scope-component: start de kinetic-type-controller op een wrapper en zoekt
 * daarbinnen naar `[data-kinetic-type]`-elementen (typisch <KineticWord>).
 * De wrapper zelf neemt geen ruimte in (`display: contents`).
 *
 * Herkomst: techniek gezien op een referentiesite (22-09-2026), eigen implementatie.
 */
export function KineticType({ children, className, ...options }: KineticTypeProps) {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!ref.current) return;
		const destroy = init(ref.current, options);
		return destroy;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		options.xAxisBelow,
		options.yFactor,
		options.xFactor,
		options.minWeight,
		options.maxWeight,
		options.maxWidth,
		options.minWidth,
		options.minAlpha,
		options.maxAlpha,
	]);

	return (
		<div ref={ref} className={className} style={{ display: "contents" }}>
			{children}
		</div>
	);
}

export interface KineticWordProps {
	children: ReactNode;
	/** "y" (verticaal, standaard) of "x" (horizontaal — voor gebruik in een
	 * horizontale track zoals horizontal-scroll-pin). */
	axis?: "x" | "y";
	/** Element-type, bv. "h3" voor een kop. Standaard "span". */
	as?: ElementType;
	className?: string;
}

/** Eén "dichtdrukbaar" woord/element. Moet binnen een <KineticType>-scope staan. */
export function KineticWord({ children, axis = "y", as: Tag = "span", className }: KineticWordProps) {
	return (
		<Tag data-kinetic-type={axis} className={className}>
			{children}
		</Tag>
	);
}

export default KineticType;
