/**
 * @jest-environment jsdom
 */

// setupTests.js ajouté pour pouvoir utliser le matcher toBeIn
import '@testing-library/jest-dom/extend-expect';

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should display the form for creating a new bill", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      const formElement = screen.getByTestId('form-new-bill');
      expect(formElement).toBeInTheDocument();
    })
  })
})
