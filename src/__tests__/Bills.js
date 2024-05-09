/**
 * @jest-environment jsdom
 */

// setupTests.js ajouté pour pouvoir utliser le matcher to
import "@testing-library/jest-dom/extend-expect";

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import mockStore from "../__mocks__/store"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsContainer from "../containers/Bills.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon"); // la ligne que j'ai ajouté
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    describe("And I click on <<Nouvelle note de frais>> button", () => {
      test("then handleClickNewBill has to be called ", () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();

        const bill = new BillsContainer({
          document,
          onNavigate,
          store: null,
          localStorage,
        });

        const handleClickNewBillSpy = jest.spyOn(bill, "handleClickNewBill");

        const btnNewBill = screen.getByTestId("btn-new-bill");
        //b
        btnNewBill.addEventListener("click", bill.handleClickNewBill);

        fireEvent.click(btnNewBill);
        expect(handleClickNewBillSpy).toBeCalled();
      });

      test("Then the New Bill Form should be displayed", () => {
        const envoyerUneNoteDeFrais = screen.getByText(
          "Envoyer une note de frais"
        );
        expect(envoyerUneNoteDeFrais).toBeInTheDocument();
      });
    });

    describe("And I click on EyeIcon for first bill", () => {
      test("Then Modal should be opened", async () => {
        document.body.innerHTML = BillsUI({ data: [bills[0]] });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const bill = new BillsContainer({
          document,
          onNavigate,
          store,
          localStorage,
        });

        await waitFor(() => screen.getByTestId("icon-eye"));

        const spyClickIconEye = jest.spyOn(bill, "handleClickIconEye");
        const eyeIcon = screen.getByTestId("icon-eye");
        $.fn.modal = jest.fn();
        fireEvent.click(eyeIcon);
        expect(spyClickIconEye).toBeCalledTimes(1);
        const modale = screen.getByText("Justificatif");
        expect(modale).toBeTruthy();
      });
    });
  });
});

// test d'intégration GET
describe("Given I am connected as an employee", () => {
  describe("When I navigate to bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({type: "Employee", email: "a@a"}));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills); 
      const store = mockStore;
      const bill = new Bills({document, onNavigate, store, localStorage});
      await bill.getBills();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
