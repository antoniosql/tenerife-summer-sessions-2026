import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";

const kpisResult = {
    status: "success" as const,
    table: {
        columns: [
            { name: "[Ventas netas]" },
            { name: "[Margen bruto]" },
            { name: "[Tasa devolucion]" },
            { name: "[Clientes en riesgo]" },
        ],
        rows: [[1602458.02, 564797.06, 0.0798547721, 116]],
    },
    fromCache: false,
    cachedAt: undefined,
};

const allCustomersResult = {
    status: "success" as const,
    table: {
        columns: [
            { name: "[customer_id]" },
            { name: "[canal]" },
            { name: "[score]" },
            { name: "[recencia_dias]" },
            { name: "[gasto_total]" },
            { name: "[tasa_devolucion_cliente]" },
            { name: "[categoria_preferida]" },
        ],
        rows: [
            ["C0061", "ONLINE", 18, 211, 5119, 0.214, "Iluminacion"],
            ["C0038", "POS", 23, 184, 4584, 0.167, "Muebles"],
            ["C0027", "ONLINE", 29, 156, 3375, 0.192, "Decoracion"],
        ],
    },
    fromCache: false,
    cachedAt: undefined,
};

const filteredCustomersResult = {
    ...allCustomersResult,
    table: {
        ...allCustomersResult.table,
        rows: [["C0027", "ONLINE", 29, 156, 3375, 0.192, "Decoracion"]],
    },
};

vi.mock("@/hooks/use-semantic-model-query", () => ({
    useSemanticModelQuery: ({ query }: { query: string }) => ({
        data: query.includes("[customer_id]")
            ? query.includes('{"ONLINE"}') && query.includes('{"Decoracion"}')
                ? filteredCustomersResult
                : allCustomersResult
            : kpisResult,
        error: undefined,
        isLoading: false,
        refetch: vi.fn(),
    }),
}));

describe("App", () => {
    it("renders without throwing", () => {
        expect(() => render(<App />)).not.toThrow();
    });

    it("mounts content into the document", () => {
        render(<App />);
        expect(document.body).not.toBeEmptyDOMElement();
    });

    it("renders semantic model KPI values", () => {
        render(<App />);

        expect(screen.getByText("Ventas netas")).toBeInTheDocument();
        expect(screen.getByText("116")).toBeInTheDocument();
        expect(screen.getByText("8 %")).toBeInTheDocument();
    });

    it("filters customers by channel and category", () => {
        render(<App />);

        fireEvent.change(screen.getByLabelText("Canal"), { target: { value: "ONLINE" } });
        fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "Decoracion" } });

        expect(screen.getByText("1 clientes")).toBeInTheDocument();
        expect(screen.getByText("C0027")).toBeInTheDocument();
        expect(screen.queryByText("C0061")).not.toBeInTheDocument();
        expect(screen.queryByText("C0038")).not.toBeInTheDocument();
    });
});
