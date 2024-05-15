/**
 * @jest-environment jsdom
 */

// setupTests.js ajouté pour pouvoir utliser le matcher to
import "@testing-library/jest-dom/extend-expect";

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsContainer from "../containers/Bills.js";

import router from "../app/Router.js";
jest.mock("../app/Store", () => mockStore); // pouvoir utiliser mockedStore instead of store 

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
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        }); // utilisation des données mockées pour le test

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        ); // on est sur le parcours employé
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();// fct qui prend le chemin comme parametre et affiche la page associée 


        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        }; // fct de navigation entre les pages de l'application 
        const bill = new BillsContainer({
          document,
          onNavigate,
          store: null,
          localStorage,
        }); // instanciation de la classe billsContainer

        const handleClickNewBillSpy = jest.spyOn(bill, "handleClickNewBill"); // espionner la méthode handleCli.. de l'objet bill
        const btnNewBill = screen.getByTestId("btn-new-bill");
        btnNewBill.addEventListener("click", bill.handleClickNewBill);
        fireEvent.click(btnNewBill);
        expect(handleClickNewBillSpy).toBeCalled(); // on a fait le spy car toBecalled()... marche juste avec le spy
      });
      // delet async
      test("Then the New Bill Form should be displayed", async () => {
        const envoyerUneNoteDeFrais = screen.getByText(
          "Envoyer une note de frais"
        ); 
        expect(envoyerUneNoteDeFrais).toBeInTheDocument();
      });
    });
// tester l'evenement click sur l'icon et l'ouverture de la modalz
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
        fireEvent.click(eyeIcon); // simuler le event listner click sur l'envi de test jest
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
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router(); // la div root pour contenir la page en fonction du chemin choisi
      window.onNavigate(ROUTES_PATH.Bills);
      const store = mockStore; // car on teste la fct getbills on aura besoin des données mockées
      const bill = new BillsContainer({
        document,
        onNavigate,
        store,
        localStorage,
      });
      await bill.getBills(); 
      // no expect because on attend l'execution de la fct sans erreur
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
      //erreur 404 :ressource not found 
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
      // erreur 500 : problème serveur généralement 
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
