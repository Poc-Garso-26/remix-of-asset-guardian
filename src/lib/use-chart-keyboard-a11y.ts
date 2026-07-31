import { useEffect, type RefObject } from "react";

type Options = {
  /** Seletor dos elementos de dados (fatias, pontos) dentro do gráfico. */
  selector: string;
  /** Rótulos acessíveis, na mesma ordem dos elementos encontrados. */
  labels: string[];
};

/**
 * Bloco G-1 + G-3 unificados.
 *
 * O Recharts renderiza o <svg> apenas depois que o ResponsiveContainer mede a
 * largura do contêiner (ResizeObserver) e, no caso das áreas/linhas, os pontos
 * só são montados no fim da animação de entrada. Por isso um useEffect simples
 * roda antes dos elementos existirem e nunca aplica os atributos.
 *
 * Aqui usamos um MutationObserver para (re)aplicar a marcação sempre que a
 * árvore do gráfico mudar:
 *  1. remove o foco de elementos genéricos (<svg>, wrappers do Recharts);
 *  2. torna focáveis os elementos de dados individuais, com rótulo acessível;
 *  3. dispara os eventos de mouse no focus/blur para exibir o tooltip existente.
 */
export function useChartKeyboardA11y(
  ref: RefObject<HTMLElement | null>,
  { selector, labels }: Options,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root || labels.length === 0) return;

    const cleanups: Array<() => void> = [];

    const apply = () => {
      // 1. Elementos genéricos não devem receber foco.
      root.querySelectorAll<SVGElement>("svg").forEach((el) => {
        el.setAttribute("tabindex", "-1");
        el.setAttribute("focusable", "false");
      });
      root
        .querySelectorAll<HTMLElement>(".recharts-wrapper[tabindex]")
        .forEach((el) => {
          el.setAttribute("tabindex", "-1");
        });

      // 2. Elementos de dados focáveis por teclado.
      //    O Recharts define tabIndex={-1} nas fatias como prop de React e
      //    reaplica isso a cada quadro da animação, então precisamos reforçar
      //    os atributos sempre que eles forem sobrescritos.
      const nodes = Array.from(root.querySelectorAll<SVGElement>(selector));
      nodes.forEach((node, i) => {
        const label = labels[i];
        if (!label) return;

        if (node.getAttribute("tabindex") !== "0") {
          node.setAttribute("tabindex", "0");
        }
        if (node.getAttribute("focusable") !== "true") {
          node.setAttribute("focusable", "true");
        }
        if (node.getAttribute("role") !== "img") {
          node.setAttribute("role", "img");
        }
        if (node.getAttribute("aria-label") !== label) {
          node.setAttribute("aria-label", label);
        }

        if (node.dataset["chartFocusable"] === "true") return;
        node.dataset["chartFocusable"] = "true";

        const fire = (type: string) => {
          node.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: window }),
          );
        };
        const onFocus = () => {
          fire("mouseover");
          fire("mouseenter");
          fire("mousemove");
        };
        const onBlur = () => {
          fire("mouseout");
          fire("mouseleave");
        };
        node.addEventListener("focus", onFocus);
        node.addEventListener("blur", onBlur);
        cleanups.push(() => {
          node.removeEventListener("focus", onFocus);
          node.removeEventListener("blur", onBlur);
        });
      });
    };

    apply();

    // childList: o <svg> só aparece depois da medição do ResponsiveContainer
    // e os pontos da área só no fim da animação.
    // attributes/tabindex: o Recharts reescreve tabindex durante a animação.
    const observer = new MutationObserver(() => {
      apply();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["tabindex"],
    });

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [ref, selector, labels]);

}
