import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";

vi.mock("@/hooks/use-semantic-model-query", () => ({
    useSemanticModelQuery: () => ({
        data: {
            status: "success",
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
        },
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
