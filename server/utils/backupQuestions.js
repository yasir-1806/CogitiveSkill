const backupQuestions = {
  "Reaction Time": [
    {
      "questionText": "If a person's reaction time is 250 milliseconds, how many such reactions can they have in one second?",
      "options": ["2", "4", "5", "10"],
      "correctAnswer": 1,
      "explanation": "1 second = 1000 milliseconds. 1000 / 250 = 4 reactions.",
      "points": 10
    },
    {
      "questionText": "Which of the following factors generally increases human reaction time (makes it slower)?",
      "options": ["Caffeine consumption", "Distraction", "Practice", "Bright lighting"],
      "correctAnswer": 1,
      "explanation": "Distractions divide attention and significantly slow down reaction times.",
      "points": 10
    },
    {
      "questionText": "In a reaction test, a subject takes 0.3 seconds to respond. Express this in milliseconds.",
      "options": ["3 ms", "30 ms", "300 ms", "3000 ms"],
      "correctAnswer": 2,
      "explanation": "0.3 seconds * 1000 = 300 milliseconds.",
      "points": 10
    },
    {
      "questionText": "Average human visual reaction time is approximately:",
      "options": ["50 milliseconds", "250 milliseconds", "1 second", "2 seconds"],
      "correctAnswer": 1,
      "explanation": "The average reaction time for visual stimuli is around 200-300 milliseconds.",
      "points": 10
    },
    {
      "questionText": "A driver sees a red light and hits the brakes in 0.75 seconds. If the car was moving at 20 m/s, how far did it travel during the reaction time?",
      "options": ["10 meters", "15 meters", "20 meters", "25 meters"],
      "correctAnswer": 1,
      "explanation": "Distance = Speed * Time = 20 * 0.75 = 15 meters.",
      "points": 10
    }
  ],
  "Memory": [
    {
      "questionText": "A man remembers 7 digits in the first attempt. If his memory capacity increases by 1 digit every month, how many digits will he remember after 4 months?",
      "options": ["8", "10", "11", "12"],
      "correctAnswer": 2,
      "explanation": "7 + 4 = 11 digits.",
      "points": 10
    },
    {
      "questionText": "Which type of memory is used to remember a phone number just long enough to dial it?",
      "options": ["Long-term memory", "Short-term memory", "Sensory memory", "Procedural memory"],
      "correctAnswer": 1,
      "explanation": "Short-term (or working) memory holds information briefly for immediate use.",
      "points": 10
    },
    {
      "questionText": "Mnemonic devices are primarily used to:",
      "options": ["Increase reaction speed", "Improve concentration", "Aid in information retrieval", "Reduce stress"],
      "correctAnswer": 2,
      "explanation": "Mnemonics are memory aids that help in encoding and retrieving information.",
      "points": 10
    },
    {
      "questionText": "If you study a list of 20 words and can recall the first 5 and last 5 better than the middle ones, this is called:",
      "options": ["Selective memory", "Serial position effect", "Amnesia", "Echoic memory"],
      "correctAnswer": 1,
      "explanation": "The serial position effect is the tendency to recall the first and last items in a series best.",
      "points": 10
    },
    {
      "questionText": "The process of grouping individual pieces of information into larger, meaningful units is called:",
      "options": ["Stacking", "Chunking", "Mapping", "Slicing"],
      "correctAnswer": 1,
      "explanation": "Chunking helps increase the effective capacity of short-term memory.",
      "points": 10
    }
  ],
  "Attention": [
    {
      "questionText": "The ability to focus on one specific stimulus while ignoring others is known as:",
      "options": ["Divided attention", "Selective attention", "Sustained attention", "Alternating attention"],
      "correctAnswer": 1,
      "explanation": "Selective attention is focusing on a particular object for a period of time while ignoring irrelevant information.",
      "points": 10
    },
    {
      "questionText": "In a 'Stroop Test', why is it harder to name the ink color of the word 'RED' when it is printed in blue ink?",
      "options": ["Color blindness", "Cognitive interference", "Poor vision", "Slow reading speed"],
      "correctAnswer": 1,
      "explanation": "The Stroop effect demonstrates the interference in reaction time of a task due to mismatched stimuli.",
      "points": 10
    },
    {
      "questionText": "Vigilance is another term for:",
      "options": ["Quick reactions", "Sustained attention", "High intelligence", "Broad knowledge"],
      "correctAnswer": 1,
      "explanation": "Vigilance refers to the ability to maintain concentrated attention over prolonged periods.",
      "points": 10
    },
    {
      "questionText": "Which of these is a classic example of divided attention?",
      "options": ["Reading a book in a quiet room", "Listening to a lecture", "Talking on the phone while driving", "Watching a movie"],
      "correctAnswer": 2,
      "explanation": "Divided attention involves processing multiple sources of information simultaneously.",
      "points": 10
    },
    {
      "questionText": "The 'Cocktail Party Effect' is an example of:",
      "options": ["Memory loss", "Visual illusion", "Selective auditory attention", "Social anxiety"],
      "correctAnswer": 2,
      "explanation": "It's the ability to focus one's auditory attention on a particular stimulus while filtering out a range of other stimuli.",
      "points": 10
    }
  ],
  "Logical Reasoning": [
    {
      "questionText": "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?",
      "options": ["1/3", "1/8", "2/8", "1/16"],
      "correctAnswer": 1,
      "explanation": "This is a geometric series where each number is half of the previous one. (1/4) / 2 = 1/8.",
      "points": 10
    },
    {
      "questionText": "If 'FRUIT' is coded as 'HTWKV', then 'APPLE' will be coded as:",
      "options": ["CRRNG", "BQQMF", "CSROE", "DTTQH"],
      "correctAnswer": 0,
      "explanation": "Each letter is shifted by 2 positions: A+2=C, P+2=R, P+2=R, L+2=N, E+2=G.",
      "points": 10
    },
    {
      "questionText": "All trees have leaves. A maple is a tree. Therefore, maple has leaves. This is an example of:",
      "options": ["Inductive reasoning", "Deductive reasoning", "Abstract reasoning", "Circular reasoning"],
      "correctAnswer": 1,
      "explanation": "Deductive reasoning moves from general premises to a specific conclusion.",
      "points": 10
    },
    {
      "questionText": "If A is B's sister, C is B's mother, D is C's father, and E is D's mother, then how is A related to D?",
      "options": ["Grandmother", "Grandfather", "Daughter", "Granddaughter"],
      "correctAnswer": 3,
      "explanation": "C is A's mother. D is C's father. So D is A's grandfather, making A the granddaughter.",
      "points": 10
    },
    {
      "questionText": "Which word does NOT belong with the others?",
      "options": ["Leopard", "Cougar", "Tiger", "Wolf"],
      "correctAnswer": 3,
      "explanation": "Leopard, Cougar, and Tiger are felines (cat family), while Wolf is a canine (dog family).",
      "points": 10
    }
  ],
  "Pattern Recognition": [
    {
      "questionText": "Find the missing number in the sequence: 4, 9, 16, 25, 36, ?",
      "options": ["40", "45", "49", "64"],
      "correctAnswer": 2,
      "explanation": "The sequence consists of squares of consecutive numbers: 2^2, 3^2, 4^2, 5^2, 6^2. The next is 7^2 = 49.",
      "points": 10
    },
    {
      "questionText": "Complete the pattern: ACE, GIK, MOQ, ?",
      "options": ["RSU", "SUW", "STV", "TVX"],
      "correctAnswer": 1,
      "explanation": "Each set skips one letter between them. A(b)C(d)E -> skip F -> G(h)I(j)K -> skip L -> M(n)O(p)Q -> skip R -> S(t)U(v)W.",
      "points": 10
    },
    {
      "questionText": "If 1=5, 2=25, 3=125, 4=625, then 5=?",
      "options": ["3125", "2500", "1", "500"],
      "correctAnswer": 0,
      "explanation": "The pattern is 5^n. For n=5, 5^5 = 3125.",
      "points": 10
    },
    {
      "questionText": "Which image completes the sequence? (Imagine: Square with 1 dot, 2 dots, 3 dots...)",
      "options": ["Square with 0 dots", "Square with 4 dots", "Empty circle", "Triangle"],
      "correctAnswer": 1,
      "explanation": "The pattern is an increasing number of dots within the same shape.",
      "points": 10
    },
    {
      "questionText": "In a certain code, '786' means 'study very hard', '958' means 'hard work pays', and '645' means 'study and work'. Which digit means 'very'?",
      "options": ["7", "8", "6", "5"],
      "correctAnswer": 0,
      "explanation": "Comparing 786 and 958, 'hard' is 8. Comparing 786 and 645, 'study' is 6. Thus, 'very' must be 7.",
      "points": 10
    }
  ],
  "Problem Solving": [
    {
      "questionText": "A clock strikes 6 times in 5 seconds. How long will it take to strike 12 times?",
      "options": ["10 seconds", "11 seconds", "12 seconds", "15 seconds"],
      "correctAnswer": 1,
      "explanation": "6 strikes have 5 intervals. 5 intervals = 5 seconds, so 1 interval = 1 second. 12 strikes have 11 intervals, which takes 11 seconds.",
      "points": 10
    },
    {
      "questionText": "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
      "options": ["$0.10", "$0.05", "$0.01", "$0.15"],
      "correctAnswer": 1,
      "explanation": "Let ball = x. Bat = x + 1. x + (x + 1) = 1.10 => 2x = 0.10 => x = 0.05.",
      "points": 10
    },
    {
      "questionText": "If 5 machines take 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?",
      "options": ["100 minutes", "50 minutes", "5 minutes", "1 minute"],
      "correctAnswer": 2,
      "explanation": "Each machine takes 5 minutes to make 1 widget. So 100 machines working simultaneously will take 5 minutes to make 100 widgets.",
      "points": 10
    },
    {
      "questionText": "You are in a race and you pass the person in second place. What place are you in now?",
      "options": ["First", "Second", "Third", "Last"],
      "correctAnswer": 1,
      "explanation": "If you pass the person in second, you take their place, which is second.",
      "points": 10
    },
    {
      "questionText": "How many months have 28 days?",
      "options": ["1", "6", "11", "12"],
      "correctAnswer": 3,
      "explanation": "All 12 months have at least 28 days.",
      "points": 10
    }
  ],
  "Verbal Ability": [
    {
      "questionText": "Choose the word which is most nearly OPPOSITE in meaning to 'ENORMOUS'.",
      "options": ["Soft", "Average", "Tiny", "Weak"],
      "correctAnswer": 2,
      "explanation": 'Enormous means very large, so "Tiny" is the opposite.',
      "points": 10
    },
    {
      "questionText": "Complete the analogy: Book is to Author as Statue is to ___.",
      "options": ["Painter", "Sculptor", "Mason", "Architect"],
      "correctAnswer": 1,
      "explanation": "An author creates a book; a sculptor creates a statue.",
      "points": 10
    },
    {
      "questionText": "Find the correctly spelled word.",
      "options": ["Accomodation", "Accommodation", "Acomodation", "Accomodatione"],
      "correctAnswer": 1,
      "explanation": "'Accommodation' is spelled with two 'c's and two 'm's.",
      "points": 10
    },
    {
      "questionText": "Pick the synonym for 'CANDID'.",
      "options": ["Vague", "Frank", "Secretive", "Dishonest"],
      "correctAnswer": 1,
      "explanation": "Candid means truthful and straightforward; Frank is the synonym.",
      "points": 10
    },
    {
      "questionText": "Which of the following is a palindrome (reads the same backwards and forwards)?",
      "options": ["LEVEL", "HELLO", "WORLD", "HAPPY"],
      "correctAnswer": 0,
      "explanation": "'LEVEL' spelled backwards is still 'LEVEL'.",
      "points": 10
    }
  ]
};

module.exports = backupQuestions;
