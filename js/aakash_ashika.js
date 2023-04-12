class Jeopardy {
  constructor() {
    this.BASE_URL = "https://jservice.io/api/";
    this.allCategories = [];
    this.data = [];
    this.boardValues = [100, 200, 300, 400, 500];
    this.modalVisibility = false;
    this.score = 0;
    this.currentObject = null;

    //get categories having 20 clues minimum -> https://jservice.io/api/categories?count=50 and sort them by highest clues to find max probability of 20 clues
    //store questions per value  and category wise by checking if 500, 400, 300 ,200 and 100 are there to make sure that only 5 clues are there
    //if question is d(one then replace it with new one
    //TODO:
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
    console.log("THis is the filterCategories", filterCategories.slice(0, 10));
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

    //TODO
    localStorage.setItem("jeopardyData", JSON.stringify(this.data));
    setTimeout(() => {
      this.loadingBoard();
    }, 100);
    console.log("THIS QUESTIONS", this.data);
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
        //atleast one question should be available of this value
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
    const getLoadingElement = document.querySelector(".loading");
    if (getLoadingElement) {
      getLoadingElement.style.opacity = 1;

      //after 1000ms delay then show the board
      setTimeout(() => {
        this.buildBoard();
      }, 1000);
    }
  }

  buildBoard() {
    const getBoard = document.querySelector("#board");
    console.log("BUILD BOARD DATA", this.data, getBoard);
    if (getBoard) {
      //remove loading element
      const getLoadingElement = document.querySelector(".loading");
      if (getLoadingElement) {
        getLoadingElement.style.opacity = 0.3;
        getLoadingElement.classList.add("hidden");
      }
      //creating a board of 5 categories
      for (let index = 0; index < this.data.length; index++) {
        const ul = document.createElement("ul");
        ul.className = "category";
        const liHeading = document.createElement("li");
        liHeading.className = "category-heading";
        liHeading.innerHTML = this.data[index].title;

        const liItem = document.createElement("li");
        liItem.className = "category-item";

        for (let index = 0; index < this.boardValues.length; index++) {
          const button = document.createElement("button");
          button.innerHTML = `$${this.boardValues[index]}`;
          button.addEventListener("click", () => {
            this.openModal(this.data[index].id, this.boardValues[index]);
          });
          liItem.appendChild(button);
          ul.appendChild(liItem);
        }

        ul.prepend(liHeading);
        getBoard.appendChild(ul);

        console.log("AFTER BOARD", getBoard);
      }
    }
  }

  toggleModal() {
    const modal = document.getElementById("questionModal");
    const overlayELement = document.querySelector(".overlay");
    if (this.modalVisibility) {
      modal.classList.remove("hidden");
      modal.classList.add("show");
      overlayELement.classList.remove("hidden");
      overlayELement.classList.add("show");
      overlayELement.addEventListener("click", () => {
        this.closeModal();
      });

      //I want to prevent scrolling of the page when modal is open
      document.body.classList.add("modal-open");
    } else {
      overlayELement.removeEventListener("click", () => {});
      modal.classList.remove("show");
      modal.classList.add("hidden");
      overlayELement.classList.remove("show");
      overlayELement.classList.add("hidden");

      document.body.classList.remove("modal-open");
    }
  }

  openModal(categoryId, value) {
    console.log("CATEGORY ID", { categoryId, value });
    const modal = document.getElementById("questionModal");
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
    // const getObj = this.data
    //   .filter((category) => category.id === categoryId)
    //   .find((item) => item.questions.value === value);

    const getObj = this.data.reduce((prev, curr) => {
      if (curr.id === categoryId) {
        return curr.questions.find((item) => item.value === value);
      }
      return prev;
    }, {});

    console.log(
      "🚀 ~ file: aakash_ashika.js:196 ~ Jeopardy ~ openModal ~ getObj:",
      getObj
    );
    if (getObj) {
      this.currentObject = getObj;
    }

    if (this.currentObject) {
      this.currentQuestion = this.data.indexOf(this.currentObject);
      //adding question
      const question = modal.querySelector("#question");
      console.log(
        "🚀 ~ file: aakash_ashika.js:203 ~ Jeopardy ~ openModal ~ question:",
        question
      );
      question.innerHTML = this.currentObject.question;

      //add eventlistener to submit button

      const formElement = modal.querySelector("form");
      formElement.addEventListener("submit", (e) => {
        e.preventDefault();
        this.checkAnswer(modal);
      });
      //submit the data and show user the result
      //if answer is correct then increase the score
    }
  }

  checkAnswer(modal) {
    const getUserAnswer = modal.querySelector("#user-answer");

    //validation
    if (!getUserAnswer || getUserAnswer.value === "") {
      return;
    }

    if ((this.currentObject.value = getUserAnswer.value)) {
      //show the correct message
      modal.querySelector(".correct-result").classList.add("show");

      //close the modal after 1 second
      setTimeout(() => {
        this.closeModal();
      }, 1000);
    } else {
      //show the incorrect message and correct answer
      modal.querySelector(".incorrect-result").classList.add("show");
      const correctAnswerElement = modal.querySelector(".correct-answer");

      correctAnswerElement.innerHTML = this.currentObject.answer;

      //close the modal after 1 second
      setTimeout(() => {
        this.closeModal();
      }, 1000);
    }
  }

  closeModal() {
    this.modalVisibility = false;
    this.toggleModal();
  }
}

new Jeopardy();
