import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@tanstack/react-router";

export interface BreadcrumbEntry {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

/**
 * Trilha de navegação reutilizável (WCAG 2.4.5 — Multiple Ways).
 * O último item é sempre a página atual (aria-current="page"), sem link.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbEntry[] }) {
  return (
    <Breadcrumb aria-label="Breadcrumb">
      <BreadcrumbList className="text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage
                    role={undefined}
                    aria-disabled={undefined}
                    aria-current="page"
                    className="font-medium"
                  >
                    {item.label}
                  </BreadcrumbPage>
                ) : item.to ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.to}
                      params={item.params as never}
                      className="inline-flex min-h-6 items-center rounded-md underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:decoration-solid"
                    >
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="font-medium text-foreground">
                    {item.label}
                  </span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator>›</BreadcrumbSeparator>}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
