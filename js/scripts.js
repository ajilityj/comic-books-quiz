(function() {
  'use strict';

  var quizDetails,
    quizQuestions,
    userAnswers = [],
    userMarks = [],
    numCorrect = 0,
    currentId = 0;

  // get shared html element(s)
  var section = document.getElementsByTagName('section')[0];
  var title = document.getElementsByTagName('h1')[0];
  var summary = document.getElementById('summary-container').getElementsByTagName('div')[1];
  var introduction = document.getElementsByTagName('h2')[0];
  var questionsContainer = document.getElementById('questions-container');
  var button = document.getElementsByTagName('button')[0];

  // get JSON data
  var getData = function(file) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();

      if (!request) {
        console.error('Cannot create an XMLHttpRequest instance.');
        return false;
      }

      request.open('GET', file);

      request.onload = function() {
        if (request.status === 200) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject(Error(request.statusText));
        }
      };

      request.onerror = function() {
        reject(Error("Network Error"));
      };

      request.send();

    });
  }

  var quiz = getData('quiz.json');
  var questions = getData('quiz/comic-books-fact-or-fiction/questions.json');

  Promise.all([quiz, questions]).then(function(response) {
    quizDetails = response[0];
    quizQuestions = response[1];

    createQuiz();
  });

  var createQuiz = function() {

    var questionTracker = '';

    // add site title & meta tags
    document.title = quizDetails.browserTitle;
    document.querySelector('meta[name="description"]').setAttribute('content', quizDetails.description);
    document.querySelector('meta[name="keywords"]').setAttribute('content', quizDetails.keywords);

    // add image to background
    document.body.style.backgroundImage = 'url(' + quizDetails.image.filePath + ')';

    // create question tracker
    for (var i = 0; i < quizDetails.numOfQuestions; i++) {
      questionTracker += '<i id="q' + (i + 1) + '" class="fa fa-circle-o"></i>';
    }

    // populate quiz title
    title.innerHTML = quizDetails.title;

    // populate quiz summary
    summary.innerHTML =
      '<span>' + quizDetails.type + ' #' + quizDetails.id + '</span>' +
      '<span>' + questionTracker + '</span>';

    // populate quiz introduction
    introduction.innerHTML = quizDetails.introduction;

    // populate quiz questions
    quizQuestions.forEach(function(q, i) {

      // create container for question
      var question = document.createElement('h3');

      // add id & class to question
      question.setAttribute('id', i + 1);

      // create question
      question.innerHTML = q.question;

      // add question to section
      questionsContainer.appendChild(question);
    });

    // create radio group for true/false question, if applicable
    if (quizDetails.quizType === 'TRUE_FALSE') {
      quizQuestions[0].answers.forEach(function(ans, i) {
        questionsContainer.innerHTML +=
          '<input type="radio" name="radio" value="' + (i + 1) + '" id="' + ans.toLowerCase() + '" />' +
          '<label for="' + ans.toLowerCase() + '">' + ans + '</label>';
      });
    }

    // add 'start quiz' listener to button
    button.innerHTML = 'Start Quiz';
    button.addEventListener('click', function() {
      startQuiz();
    });
  }

  var startQuiz = function() {

    // hide 'start quiz' button
    button.style.display = 'none';

    // hide introduction
    introduction.style.display = 'none';

    // show first question
    document.getElementById('1').style.display = 'block';
    document.getElementById('q1').classList.toggle('fa-circle');
    currentId++;

    // replace Quiz id in Summary with Question number
    summary.getElementsByTagName('span')[0].innerHTML = 'Question 1 of ' + quizDetails.numOfQuestions;

    // show radio group for true/false question, if applicable
    if (quizDetails.quizType === 'TRUE_FALSE') {

      [].forEach.call(document.getElementsByTagName('label'), function(label) {
        // show true/false option
        label.style.display = 'block';
      });

      // add 'submit' listener to answer options
      toggleEventListener('add');
    }
  }

  var submitAnswer = function(id) {

    // get correct answer
    var correctAnswer = quizQuestions[(id - 1)].correct;

    // get user-selected answer
    var selectedAnswer = parseInt(document.querySelector('input:checked').value);
    userAnswers.push(selectedAnswer);

    // decide whether selected answer is correct or incorrect
    if (selectedAnswer === null || selectedAnswer !== correctAnswer) {
      userMarks.push('Incorrect');
      markAnswer('Incorrect');
    } else {
      numCorrect++;
      userMarks.push('Correct');
      markAnswer('Correct');
    }

    function markAnswer(mark) {

      // show correct/incorrect mark on question tracker
      if (mark === 'Correct') {
        document.getElementById('q' + id).style.color = 'green';
      } else {
        document.getElementById('q' + id).style.color = 'red';
      }

      // show next question
      setTimeout(showNextQuestion, 250, id);
    }
  }

  var showNextQuestion = function(id) {

    // hide current question
    document.getElementById(id).style.display = 'none';

    // show next question, if available
    if (id < quizDetails.numOfQuestions) {

      // get question id/number of next question
      currentId++;

      // update Question number in Summary
      summary.getElementsByTagName('span')[0].innerHTML = 'Question ' + currentId + ' of ' + quizDetails.numOfQuestions;

      // show next question
      document.getElementById(currentId).style.display = 'block';
      document.getElementById('q' + currentId).classList.toggle('fa-circle');

      // reset radio selections from previous question
      [].forEach.call(document.getElementsByTagName('input'), function(input) {
        if (input.checked) {
          input.checked = false;
        }
      });

      // add 'submit' listener to answer options
      toggleEventListener('add');

    } else {
      // show final results
      showResults();
    }
  }

  var showResults = function() {
    // calculate score
    var score = Math.ceil(numCorrect / quizQuestions.length * 100);

    // clear Question info from Summary
    summary.getElementsByTagName('span')[0].innerHTML = '';

    // clear questions
    questionsContainer.innerHTML = '';

    // hide true/false options
    [].forEach.call(document.getElementsByTagName('label'), function(label) {
      label.style.display = 'none';
    });

    // show score
    summary.getElementsByTagName('span')[0].innerHTML = 'Score: ' + score + '%';

    // show results
    quizQuestions.forEach(function(q, i) {

      var quizAnswer, userAnswer;

      // set verbiage to answer
      if (quizQuestions[i].correct === 1) {
        quizAnswer = 'FACT';
      } else {
        quizAnswer = 'FICTION';
      }

      // set verbiage to user's answer
      if (userAnswers[i] === 1) {
        userAnswer = 'FACT';
      } else {
        userAnswer = 'FICTION';
      }

      // show results
      questionsContainer.innerHTML += '<h4>' + (i + 1) + '. ' + quizQuestions[i].question + '</h4>';
      if (userAnswer === quizAnswer) {
        questionsContainer.innerHTML += '<p class="correct">Your Answer: ' + userAnswer + '</p>';
      } else {
        questionsContainer.innerHTML += '<p class="incorrect">Your Answer: ' + userAnswer + '</p>';
      }
      questionsContainer.innerHTML += '<p class="explanation">' + quizQuestions[i].explanation + '</p><hr>';

    });

    // show 'replay quiz' button
    button.innerHTML = '<i class="fa fa-repeat"></i> Replay';
    button.style.display = 'block';
    button.addEventListener('click', function() {
      location.reload();
    });
  }

  var toggleEventListener = function(event) {
    [].forEach.call(document.getElementsByTagName('label'), function(label) {
      if (event === 'add') {
        // add event listener & pointer event styles to answer options
        label.style.pointerEvents = 'auto';
        label.addEventListener('click', clickHandler);
      } else {
        // remove event listener & pointer event styles to answer options
        label.style.pointerEvents = 'none';
        label.removeEventListener('click', clickHandler);
      }
    });
  }

  var clickHandler = function() {
    // remove 'submit' listener from answer options
    toggleEventListener('remove');

    setTimeout(submitAnswer, 250, currentId);
  }

})();
