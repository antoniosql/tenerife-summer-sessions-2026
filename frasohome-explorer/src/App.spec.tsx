//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "@/App";

describe("App", () => {
    it("renders without throwing", () => {
        expect(() => render(<App />)).not.toThrow();
    });

    it("mounts content into the document", () => {
        render(<App />);
        expect(document.body).not.toBeEmptyDOMElement();
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
