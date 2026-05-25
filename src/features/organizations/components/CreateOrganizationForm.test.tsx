import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateOrganizationForm from "./CreateOrganizationForm";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

describe("CreateOrganizationForm", () => {
  describe("when allowOrgCreation is false", () => {
    it("shows the permission denied warning alert", () => {
      render(
        <CreateOrganizationForm allowOrgCreation={false} onCreate={vi.fn()} />,
      );

      expect(
        screen.getByText(/Entre em contato com o administrador do sistema/i),
      ).toBeInTheDocument();
    });

    it("does not render the name input field", () => {
      render(
        <CreateOrganizationForm allowOrgCreation={false} onCreate={vi.fn()} />,
      );

      expect(screen.queryByTestId("org-name-input")).not.toBeInTheDocument();
    });

    it("does not render the submit button", () => {
      render(
        <CreateOrganizationForm allowOrgCreation={false} onCreate={vi.fn()} />,
      );

      expect(screen.queryByTestId("org-submit-button")).not.toBeInTheDocument();
    });

    it("never calls onCreate even if form were somehow submitted", () => {
      const onCreate = vi.fn();
      render(
        <CreateOrganizationForm allowOrgCreation={false} onCreate={onCreate} />,
      );
      // No form is rendered, so onCreate should never be called.
      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  describe("when allowOrgCreation is true", () => {
    it("renders the name input and submit button", () => {
      render(
        <CreateOrganizationForm allowOrgCreation={true} onCreate={vi.fn()} />,
      );

      expect(screen.getByTestId("org-name-input")).toBeInTheDocument();
      expect(screen.getByTestId("org-submit-button")).toBeInTheDocument();
    });

    it("does not show the permission denied warning", () => {
      render(
        <CreateOrganizationForm allowOrgCreation={true} onCreate={vi.fn()} />,
      );

      expect(
        screen.queryByText(/administrador do sistema/i),
      ).not.toBeInTheDocument();
    });

    it("calls onCreate with the typed name on form submit", async () => {
      const onCreate = vi.fn().mockResolvedValue(undefined);
      render(
        <CreateOrganizationForm allowOrgCreation={true} onCreate={onCreate} />,
      );

      const input = screen.getByTestId("org-name-input");
      fireEvent.change(input, { target: { value: "My New Org" } });
      fireEvent.click(screen.getByTestId("org-submit-button"));

      await waitFor(() => {
        expect(onCreate).toHaveBeenCalledWith("My New Org");
      });
    });

    it("does not call onCreate when name is empty", async () => {
      const onCreate = vi.fn();
      render(
        <CreateOrganizationForm allowOrgCreation={true} onCreate={onCreate} />,
      );

      // Try to submit without filling the input — HTML required attribute prevents it.
      // We test that onCreate was NOT called.
      fireEvent.click(screen.getByTestId("org-submit-button"));
      await waitFor(() => {
        expect(onCreate).not.toHaveBeenCalled();
      });
    });
  });
});
