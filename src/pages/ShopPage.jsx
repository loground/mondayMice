import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ToonModel } from '../components/models/ToonModel'

const PRODUCTS = [
  {
    id: 'kill',
    name: 'kill t shirt',
    image: '/shop/kill_full.png',
    zoomImage: '/shop/kill_zoomed.png',
  },
  {
    id: 'sima',
    name: 'sima t shirt',
    image: '/shop/sima_full.png',
    zoomImage: '/shop/sima_zoomed.png',
  },
  {
    id: 'spiral',
    name: 'spiral t shirt',
    image: '/shop/spiral_full.png',
    zoomImage: '/shop/spiral_zoomed.png',
  },
  {
    id: 'jail',
    name: 'jail t shirt',
    image: '/shop/jail_full.png',
    zoomImage: '/shop/jail_zoomed.png',
  },
]

const SIZES = ['M', 'L', 'XL']
const PRICE = 3150

const SIZE_DETAILS = [
  {
    size: 'M',
    rows: ['длина — 71 см', 'обхват груди — 112 см', 'ширина плеч — 52 см', 'длина рукава — 22 см'],
  },
  {
    size: 'L',
    rows: ['длина — 74 см', 'обхват груди — 120 см', 'ширина плеч — 54 см', 'длина рукава — 24 см'],
  },
  {
    size: 'XL',
    rows: ['длина — 77 см', 'обхват груди — 128 см', 'ширина плеч — 60 см', 'длина рукава — 25 см'],
  },
]

const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`

export function ShopPage({ onBack }) {
  const [hovered, setHovered] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState(() =>
    PRODUCTS.reduce((sizes, product) => ({ ...sizes, [product.id]: SIZES[0] }), {}),
  )
  const [cartItems, setCartItems] = useState([])

  const cartTotal = cartItems.length * PRICE

  const telegramLink = useMemo(() => {
    const itemLines = cartItems.map((item) => `- ${item.name}, size ${item.size}`)
    const message = ['йо, я хочу купить эти предметы с сайта monday mice:', ...itemLines].join('\n')

    return `https://t.me/le3v1?text=${encodeURIComponent(message)}`
  }, [cartItems])

  const handleModelReady = () => {
    window.dispatchEvent(new CustomEvent('shop-model-ready'))
  }

  const addToCart = (product) => {
    setCartItems((items) => [
      ...items,
      {
        cartId: `${product.id}-${selectedSizes[product.id]}-${Date.now()}-${items.length}`,
        id: product.id,
        name: product.name,
        size: selectedSizes[product.id],
      },
    ])
  }

  const removeFromCart = (cartId) => {
    setCartItems((items) => items.filter((item) => item.cartId !== cartId))
  }

  return (
    <main className="shop-page" aria-label="Shop page">
      <button
        type="button"
        className="shop-page__corner-model"
        onClick={onBack}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerCancel={() => setHovered(false)}
        aria-label="Back"
      >
        <Canvas camera={{ position: [0, 0, 4.8], fov: 34 }} dpr={[1, 2]}>
          <ambientLight intensity={0.72} color="#f5f1e8" />
          <hemisphereLight intensity={0.86} color="#ffe2b5" groundColor="#9fb3d8" />
          <directionalLight position={[2.8, 3.2, 2]} intensity={1.1} color="#ffdcb2" />
          <directionalLight position={[-2, 1.8, -2.2]} intensity={0.55} color="#ccdcff" />
          <ToonModel
            modelPath="/newMouse.glb"
            hovered={hovered}
            selected
            animate
            snapToBasePose
            onReady={handleModelReady}
          />
        </Canvas>
      </button>

      <section className="shop-page__content">
        <div className="shop-page__catalog" aria-label="Monday mice shop">
          <div className="shop-page__grid">
            {PRODUCTS.map((product) => (
              <article className="shop-card" key={product.id}>
                <div className="shop-card__image-wrap">
                  <img className="shop-card__image shop-card__image--base" src={product.image} alt={product.name} />
                  <img
                    className="shop-card__image shop-card__image--zoom"
                    src={product.zoomImage}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="shop-card__info">
                  <div>
                    <h2 className="shop-card__name">{product.name}</h2>
                    <p className="shop-card__price">{formatPrice(PRICE)}</p>
                  </div>
                  <label className="shop-card__size">
                    <span>размер</span>
                    <select
                      value={selectedSizes[product.id]}
                      onChange={(event) =>
                        setSelectedSizes((sizes) => ({
                          ...sizes,
                          [product.id]: event.target.value,
                        }))
                      }
                    >
                      {SIZES.map((size) => (
                        <option value={size} key={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="shop-card__add" type="button" onClick={() => addToCart(product)}>
                    добавить в корзину
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="shop-cart" aria-label="Cart">
            <div className="shop-cart__header">
              <h2>корзина</h2>
              <span>{cartItems.length}</span>
            </div>

            {cartItems.length > 0 ? (
              <ul className="shop-cart__items">
                {cartItems.map((item) => (
                  <li className="shop-cart__item" key={item.cartId}>
                    <span>
                      {item.name}
                      <small>{item.size}</small>
                    </span>
                    <button type="button" onClick={() => removeFromCart(item.cartId)} aria-label={`Remove ${item.name}`}>
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="shop-cart__empty">добавь предмет в корзину</p>
            )}

            <div className="shop-cart__total">
              <span>total</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            {cartItems.length > 0 ? (
              <a className="shop-cart__proceed" href={telegramLink} target="_blank" rel="noreferrer">
                оформить заказ
              </a>
            ) : (
              <button className="shop-cart__proceed" type="button" disabled>
                оформить заказ
              </button>
            )}

            <div className="shop-details">
              <section>
                <h3>Характеристики:</h3>
                <ul>
                  <li>Принт пластизольными красками на груди</li>
                  <li>Оверсайз крой</li>
                  <li>Состав: 100% хлопок, 245 г/м²</li>
                </ul>
              </section>

              <section>
                <h3>Размеры:</h3>
                <div className="shop-details__sizes">
                  {SIZE_DETAILS.map((sizeInfo) => (
                    <div className="shop-details__size" key={sizeInfo.size}>
                      <strong>{sizeInfo.size}</strong>
                      <ul>
                        {sizeInfo.rows.map((row) => (
                          <li key={row}>{row}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
