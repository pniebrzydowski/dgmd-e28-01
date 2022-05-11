import { useCallback, useEffect, useState } from 'react';

import useUnoDeck from '../../hooks/useUnoDeck'
import ChooseColor from '../ChooseColor/ChooseColor';
import Deck from '../Deck/Deck';
import PlayerHands from '../PlayerHands/PlayerHands';

import './styles.css';

const getHandScore = (hand) => hand.cards.reduce((prev, curr) => {
  if (curr.value === 'D' || curr.value === 'S' || curr.value === 'R') {
    return prev + 10;
  }
  if (curr.value === 'Wild') {
    return prev + 40;
  }
  if (curr.value === 'Draw Four') {
    return prev + 50;
  }
  return prev + curr.value;
}
  , 0);

const GameBoard = ({players, onGameEnd}) => {
  const [playDirection, setPlayDirection] = useState(null);
  const [gameStart, setGameStart] = useState(null);
  const [currentPlayerIndex, setcurrentPlayerIndex] = useState(null);
  const [wildPlayed, setWildPlayed] = useState(false);
  const [hands, setHands] = useState([]);
  const deck = useUnoDeck();

  useEffect(() => {
    const h = players.map(p => ({
      player: p,
      cards: null
    }));
    setHands(h);
  }, [players]);

  const gameOver = hands.some(hand => hand.cards !== null && hand.cards.length === 0);

  const endGame = useCallback(() => {
    setPlayDirection(null);
    onGameEnd({
      start: gameStart,
      end: new Date().valueOf(),
      scores: hands.map(hand => getHandScore(hand))
    });
  }, [gameStart, hands, onGameEnd]);

  useEffect(() => {
    if (gameOver) {
      endGame();
    }
  }, [endGame, gameOver]);

  if (!players.length) {
    return null;
  }

  const addCardsToHand = (numberOfCards, hand) => {
    setHands((prevState) => {
      const h = [
        ...prevState
      ];
      const playerIndex = h.findIndex(playerHand => playerHand.player.id === hand.player.id);
      h[playerIndex].cards = [
        ...hand.cards,
        ...deck.dealNewCards(numberOfCards)
      ];
      return h;
    });
  }

  const startNewGame = () => {
    const h = [...hands];
    h.forEach(hand => {
      hand.cards = deck.dealNewCards(1)
    });
    deck.flipCard();
    setHands(h);
    setGameStart(new Date().valueOf());
    setcurrentPlayerIndex(0);
    setPlayDirection('forward');
  }

  const advanceTurn = (activePlayer, playDirection) => {
    if (playDirection === 'forward') {
      if (activePlayer === players.length - 1) {
        return 0;
      }
      return activePlayer + 1; 
    }

    if (activePlayer === 0) {
      return players.length - 1;
    }
    return activePlayer - 1;
  }

  const onChooseColor = (color) => {
    deck.chooseWildColor(color);
    setWildPlayed(false);
    setcurrentPlayerIndex(advanceTurn(currentPlayerIndex));
  }

  const evaluateCard = (cardValue) => {
    let actOnPlayer = advanceTurn(currentPlayerIndex);

    if (cardValue === 'Draw Four') {
      addCardsToHand(4, hands[actOnPlayer]);
    }

    if (cardValue === 'Draw Four' || cardValue === 'Wild') {
      setWildPlayed(true);
      return;
    }

    if (cardValue === 'R') {
      if (players.length === 2) {
        actOnPlayer = advanceTurn(actOnPlayer);
      }  
      setPlayDirection('reverse');
    }

    if (cardValue === 'S') {
      actOnPlayer = advanceTurn(actOnPlayer);
    }
    if (cardValue === 'D') {
      addCardsToHand(2, hands[actOnPlayer]);
    }
    setcurrentPlayerIndex(actOnPlayer);
  }

  const playCard = (hand, card) => {
    const isValid = deck.playCard(card);
    if (!isValid) {
      alert('Sorry, that card cannot be played at this time');
      return;
    }
    const idx = hand.cards.findIndex(handCard => handCard.value === card.value && handCard.color === card.color);
    hand.cards.splice(idx, 1);


    setHands((prevState) => {
      const h = [
        ...prevState
      ];
      const playerIndex = h.findIndex(playerHand => playerHand.player.id === hand.player.id);
      h[playerIndex].cards = hand.cards;
      return h;
    });
    deck.playCard(card);
    evaluateCard(card.value);
  }

  const onPass = () => {
    const currentPlayerHand = hands[currentPlayerIndex];
    addCardsToHand(1, currentPlayerHand);
    setcurrentPlayerIndex(advanceTurn(currentPlayerIndex));
  }

  return (
    <>
      {!playDirection && (
        <button type="button" onClick={startNewGame}>Start New Game</button>
      )}

      {!!playDirection && (
        <section className="gameBoard-wrapper">
          <Deck deck={deck} />
          {wildPlayed && <ChooseColor onChooseColor={onChooseColor} />}
          <PlayerHands
            hands={hands}
            currentPlayerIndex={currentPlayerIndex}
            playCard={playCard}
            onPass={onPass}
            canPlay={!wildPlayed}
          />
        </section>
      )}

      {gameOver && (
        <p>Final Scores:
          {hands.reduce((prev, curr) => (
            [
              ...prev,
              `${curr.player.name}: ${getHandScore(curr)}`
            ]
          ), []).join(', ')}
        </p>
      )}
    </>
  );
};

export default GameBoard;
