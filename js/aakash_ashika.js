/**
 * Jeopardy
 * @author Aakash Patel and Ashika Trambadiya
 * @version 1.0
 * @since 1.0
 * @description Jeopardy is a game where you have to guess the correct answer of a question.
 * @copyright Copyright (c) 2023
 * @license MIT
 * @see https://github.com/itsaakashpatel/Jeopardy-project
 * @live https://jeopardy-project.vercel.app/
 *
 */

class Jeopardy {
  constructor() {
    this.BASE_URL = "https://jservice.io/api/";
    this.allCategories = [];
    this.data = [];
    this.boardValues = [100, 200, 300, 400, 500];
    this.modalVisibility = false;
    this.score = 0;
    this.currentObject = null;
    this.currentElementId = null;

    //get categories having 20 clues minimum -> https://jservice.io/api/categories?count=50 and sort them by highest clues to find max probability of 20 clues
    //store questions per value  and category wise by checking if 500, 400, 300 ,200 and 100 are there to make sure that only 5 clues are there

    //MAKING API CALL FOR THE FIRST TIME THEN STORE TO LOCAL STORAGE TO AVOID FREQUENT API CALLS
    if (localStorage.getItem("jeopardyData")) {
      this.data = JSON.parse(localStorage.getItem("jeopardyData"));

      setTimeout(() => {
        this.loadingBoard();
      }, 100);
    } else {
      this.getCategories();
    }
  }

  async getCategories() {
    //fetch category API call
    const getCategoriesData = await fetch(this.BASE_URL + "categories?count=50")
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        alert("Something went wrong ->" + err);
      });

    //sorting categories by highest clues to find max probability of  all required clues
    let filterCategories = getCategoriesData
      .sort((a, b) => b.clues_count - a.clues_count)
      .filter((item) => item.clues_count >= 20);

    this.allCategories = filterCategories.slice(0, 10);
    this.getQuestions(filterCategories.slice(0, 10));
    console.log("DATA FROM API", filterCategories.slice(0, 10));
  }

  async getQuestions() {
    const promiseArray = [];
    for (const category of this.allCategories) {
      promiseArray.push(
        this.getQuestionsByCategory(category.id, category.title)
      );
    }

    const allCategories = await Promise.allSettled(promiseArray);
    this.data = allCategories
      .filter((item) => item.status === "fulfilled" && item.value.valid)
      .map((validCategory) => validCategory.value.data)
      .slice(0, 5);

    //STORE TO LOCAL STORAGE TO AVOID FREQUENT API CALLS
    localStorage.setItem("jeopardyData", JSON.stringify(this.data));
    setTimeout(() => {
      this.loadingBoard();
    }, 100);
    console.log("THE QUESTIONS LIST FROM API", this.data);
  }

  //Here we are going to get questions from each category and check if valid category having all required boardValues
  async getQuestionsByCategory(categoryId, categoryTitle) {
    let validCategory = true;
    const getQuestionsByCategoryData = await fetch(
      this.BASE_URL + "clues?category=" + categoryId
    ).then((res) => res.json());

    //Filter to check all boardValues of questions should be there
    this.boardValues.forEach((element) => {
      if (!getQuestionsByCategoryData.some((item) => item.value === element)) {
        //at least one question should be available of this value
        validCategory = false;
      }
    });

    if (validCategory) {
      return {
        valid: true,
        data: {
          title: categoryTitle,
          id: categoryId,
          questions: getQuestionsByCategoryData,
        },
      };
    } else {
      return {
        valid: false,
        data: {},
      };
    }
  }

  loadingBoard() {
    const getLoadingElement = this.getElementByClass("loading");
    if (getLoadingElement) {
      getLoadingElement.style.opacity = 1;

      //after 1000ms delay then show the board
      setTimeout(() => {
        this.buildBoard();
      }, 1000);
    }
  }

  buildBoard() {
    const getBoard = this.getElementById("board");

    //CHECK DATA IS AVAILABLE BEFORE BUILDING BOARD
    if (this.data.length === 0) {
      //TRY TO GET IT FROM THE API AGAIN!
      this.getCategories();
      return;
    }

    console.log("BUILD BOARD DATA", this.data, this.boardValues);
    if (getBoard) {
      //remove loading element
      const getLoadingElement = this.getElementByClass("loading");
      if (getLoadingElement) {
        getLoadingElement.style.opacity = 0.3;
        getLoadingElement.classList.remove("show");
        getLoadingElement.classList.add("hidden");
      }

      //creating a board of 5 categories
      for (let index = 0; index < this.data.length; index++) {
        const ul = document.createElement("ul");
        const liHeading = document.createElement("li");

        ul.className = "category";
        ul.id = `category-${this.data[index].id}`;
        liHeading.className = "category-heading";
        liHeading.innerHTML = this.data[index].title;

        for (let item = 0; item < this.boardValues.length; item++) {
          const liItem = document.createElement("li");
          const button = document.createElement("button");

          liItem.className = "category-item";
          button.innerHTML = `$${this.boardValues[item]}`;

          button.addEventListener("click", () => {
            this.openModal(this.data[index].id, this.boardValues[item]);
          });

          //assign unique id to each element, will use it later to identify the element in the board
          liItem.id = `category-${this.data[index].id}-${this.boardValues[item]}`;
          liItem.appendChild(button);
          ul.appendChild(liItem);
        }

        ul.prepend(liHeading);
        getBoard.appendChild(ul);
      }
    }

    //add ability to reset the board
    const getResetBoard = this.getElementById("reset-board");

    if (getResetBoard) {
      getResetBoard.addEventListener("click", () => {
        this.resetBoard();
      });
    }
  }

  toggleModal() {
    const modal = this.getElementById("questionModal");
    const overlayELement = this.getElementByClass("overlay");

    if (this.modalVisibility && modal && overlayELement) {
      modal.classList.remove("hidden");
      modal.classList.add("show");

      overlayELement.classList.remove("hidden");
      overlayELement.classList.add("show");
      overlayELement.addEventListener("click", () => {
        this.closeModal();
      });

      //I want to prevent scrolling of the body when modal is open
      document.body.classList.add("modal-open");
    } else {
      modal.classList.remove("show");
      modal.classList.add("hidden");

      overlayELement.removeEventListener("click", () => {});
      overlayELement.classList.remove("show");
      overlayELement.classList.add("hidden");

      document.body.classList.remove("modal-open");
    }
  }

  openModal(categoryId, value) {
    console.log("CATEGORY ID & VALUE", { categoryId, value });
    if (!categoryId || !value) return;

    //set currentElementId
    this.currentElementId = `category-${categoryId}-${value}`;

    const modal = this.getElementById("questionModal");
    this.modalVisibility = true;
    this.toggleModal();

    //add eventlistener to close button
    const closeButton = document.querySelector("#questionModal .close-button");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        this.closeModal();
      });
    }

    //find the question having value
    const getObj = this.data.reduce((prev, curr) => {
      if (curr.id === categoryId) {
        return curr.questions.find((item) => item.value === value);
      }
      return prev;
    }, {});

    console.log("QUESTION", getObj);

    if (getObj) {
      this.currentObject = getObj;
    }

    if (this.currentObject) {
      this.currentQuestion = this.data.indexOf(this.currentObject);

      //adding question
      const question = modal.querySelector("#question");
      question.innerHTML = this.currentObject.question;

      //add eventlistener to submit button
      const formElement = modal.querySelector("form");
      formElement.addEventListener("submit", (e) => {
        e.preventDefault();
        this.checkAnswer(modal);
      });
    }
  }

  checkAnswer(modal) {
    const getUserAnswer = modal.querySelector("#user-answer");

    //validation
    if (
      !getUserAnswer ||
      getUserAnswer.value === "" ||
      !this.currentObject.answer
    ) {
      return;
    }

    if (
      this.currentObject.answer.trim().toLowerCase() ===
      getUserAnswer.value.trim().toLowerCase()
    ) {
      //show the correct message
      modal.querySelector(".correct-result").classList.remove("hidden");
      modal.querySelector(".correct-result").classList.add("show");

      //close the modal after 1.5 second, remove the item from the board and increase the score
      setTimeout(() => {
        this.scoreAccumulator();
        this.removeItemFromBoard();
        this.closeModal();
      }, 1500);
    } else {
      //show the incorrect message and correct answer
      modal.querySelector(".incorrect-result").classList.remove("hidden");
      modal.querySelector(".incorrect-result").classList.add("show");

      const correctAnswerElement = modal.querySelector(".correct-answer");
      correctAnswerElement.classList.add("show");
      correctAnswerElement.innerHTML = `The correct answer is : ${this.currentObject.answer}`;

      //close the modal after 2 second, remove the item from the board only
      setTimeout(() => {
        this.removeItemFromBoard();
        this.closeModal();
      }, 2000);
    }
  }

  closeModal() {
    this.modalVisibility = false;
    this.changeToInitialValues();
    this.toggleModal();
  }

  removeItemFromBoard() {
    if (this.currentElementId) {
      const getItemButton = document.querySelector(
        `#${this.currentElementId} > button`
      );
      getItemButton.innerHTML = "";
      getItemButton.style.pointerEvents = "none";
      getItemButton.style.height = "94px";
      getItemButton.style.opacity = 0.8;
    }
  }

  changeToInitialValues() {
    const modal = this.getElementById("questionModal");
    const getQuestion = this.getElementById("question");
    const getUserAnswer = this.getElementById("user-answer");
    const getCorrectAnswer = this.getElementByClass("correct-answer");
    const getCorrectResult = this.getElementByClass("correct-result");
    const getIncorrectResult = this.getElementByClass("incorrect-result");

    if (
      !modal ||
      !getQuestion ||
      !getUserAnswer ||
      !getCorrectAnswer ||
      !getCorrectResult ||
      !getIncorrectResult
    ) {
      return;
    }

    getQuestion.innerHTML = "";
    getUserAnswer.value = "";

    getCorrectAnswer.classList.remove("show");
    getCorrectAnswer.innerHTML = "";
    getCorrectAnswer.classList.add("hidden");

    getIncorrectResult.classList.remove("show");
    getIncorrectResult.classList.add("hidden");

    getCorrectResult.classList.remove("show");
    getCorrectResult.classList.add("hidden");

    this.currentElementId = null;
    this.currentObject = null;
  }

  scoreAccumulator() {
    const getScore = this.getElementById("your-score");

    if (!getScore) return;

    //increase score
    if (this.currentElementId || this.currentObject) {
      const finalScore = this.score + this.currentObject.value;

      const interval = setInterval(() => {
        this.score = this.score + 1;
        getScore.innerHTML = this.score;
        if (this.score === finalScore) {
          clearInterval(interval);
        }
      }, 50);
    }
  }

  resetBoard() {
    const loadingElement = this.getElementByClass("loading");
    const board = this.getElementById("board");
    const score = this.getElementById("your-score");

    //reset the board and score
    this.score = 0;

    if (score) {
      score.innerHTML = this.score;
    }

    if (board) {
      board.innerHTML = "";
    }

    if (loadingElement) {
      loadingElement.classList.remove("hidden");
      loadingElement.classList.add("show");
    }
    this.changeToInitialValues();
    //load again the board
    this.loadingBoard();
  }

  //HELPER METHODS

  getElementByClass(key) {
    return document.querySelector(`.${key}`);
  }

  getElementById(key) {
    return document.getElementById(key);
  }
}

new Jeopardy();
