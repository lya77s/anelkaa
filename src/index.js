import React, { useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const PRODUCTS = [
  { id: "p1", name: "Телевизор" },
  { id: "p2", name: "Ноутбук" },
  { id: "p3", name: "Смартфон" },
];

function detectCardType(cardNumber) {
  if (!cardNumber) return "";
  const trimmed = cardNumber.replace(/\s+/g, "");
  if (trimmed.startsWith("4")) return "Visa";
  if (trimmed.startsWith("5")) return "MasterCard";
  return "Unknown";
}

const validationSchema = Yup.object().shape({
  paymentMethod: Yup.string().required("Төлем түрін таңдаңыз"),

  cardNumber: Yup.string().when("paymentMethod", (val, schema) => {
    if (val === "card") {
      return schema
        .required("Карта нөмірін енгізіңіз")
        .matches(/^[0-9]{16}$/, "Карта нөмірі дәл 16 сан болу керек")

        .test(
          "not99909",
          "Бұл карта нөмірі тыйым салынған (99909)!",
          (value) => !value?.includes("99909")
        );
    }
    return schema.notRequired();
  }),

  cardExpiry: Yup.string().when("paymentMethod", (val, schema) => {
    if (val === "card") {
      return schema
        .required("Мерзімін көрсетіңіз (MM/YY)")
        .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Формат MM/YY, мысалы 09/25");
    }
    return schema.notRequired();
  }),

  cardCVV: Yup.string().when("paymentMethod", (val, schema) => {
    if (val === "card") {
      return (
        schema
          .required("CVV кодын енгізіңіз")
          // Если хотим ровно 3 цифры:
          .matches(/^[0-9]{3}$/, "CVV 3 сан болу керек")
      );
      // (Если нужно 3-4:  /^[0-9]{3,4}$/ )
    }
    return schema.notRequired();
  }),

  // Адрес доставки
  address: Yup.string().required("Жеткізу мекенжайын енгізіңіз"),

  // Массив выбранных товаров
  selectedProducts: Yup.array().of(Yup.string()),

  // Объект-словарь (id товара -> количество)
  quantities: Yup.object()
    .shape({})
    .test("quantities-check", "Сан 1-ден жоғары болуы керек", function (value) {
      const { selectedProducts } = this.parent;
      if (!selectedProducts || selectedProducts.length === 0) {
        // Если пользователь не выбрал ни одного товара — нет ошибок
        return true;
      }
      // Проверяем все выбранные товары на количество > 0
      for (let productId of selectedProducts) {
        if (!value[productId] || parseInt(value[productId]) <= 0) {
          return false;
        }
      }
      return true;
    }),
});

// ------------ СТИЛИ ------------
const formStyles = {
  container: {
    maxWidth: 650,
    margin: "20px auto",
    padding: 20,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontFamily: "sans-serif",
    backgroundColor: "#fefefe",
  },
  title: {
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    marginTop: 5,
    fontSize: "0.9rem",
  },
  input: {
    width: "100%",
    padding: 8,
    fontSize: 14,
    marginBottom: 5,
  },
  productsBlock: {
    margin: "10px 0",
  },
  productItem: {
    marginBottom: 5,
  },
  button: {
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 16,
    border: "none",
    borderRadius: 4,
    color: "#fff",
    backgroundColor: "#28a745",
  },
  successBox: {
    color: "green",
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
};

// ------------ КОМПОНЕНТ «ПРЕДПРОСМОТР КАРТЫ» ------------
// Показывает мини-карту с введёнными данными
const cardStyles = {
  wrapper: {
    width: 320,
    height: 200,
    borderRadius: 12,
    background: "linear-gradient(135deg, #52ba91, #2ab0ed)",
    color: "#fff",
    padding: "16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    marginTop: 10,
  },
  logo: {
    width: 60,
    height: 40,
    objectFit: "contain",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  number: {
    fontSize: "1.4rem",
    letterSpacing: "2px",
    marginTop: 24,
  },
  footer: {
    marginTop: 24,
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
  },
};

function CreditCardPreview({ cardNumber, cardExpiry, cardCVV, cardType }) {
  // Разделяем 16 цифр по 4 группы
  const formattedNumber = cardNumber
    ? cardNumber.replace(/(.{4})/g, "$1 ").trim()
    : "#### #### #### ####";

  const displayedExpiry = cardExpiry || "MM/YY";
  const displayedCVV = cardCVV || "CVV";

  // Лого (Visa / MasterCard), если определено
  let logoSrc = "";
  if (cardType === "Visa") {
    logoSrc =
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";
  } else if (cardType === "MasterCard") {
    logoSrc =
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg";
  }

  return (
    <div style={cardStyles.wrapper}>
      <div style={cardStyles.row}>
        <div>Банктік карта</div>
        {logoSrc && (
          <img src={logoSrc} style={cardStyles.logo} alt={cardType} />
        )}
      </div>

      <div style={cardStyles.number}>{formattedNumber}</div>

      <div style={cardStyles.footer}>
        <span>{displayedExpiry}</span>
        <span>{displayedCVV}</span>
      </div>
    </div>
  );
}

// ------------ ГЛАВНЫЙ КОМПОНЕНТ ------------
function OrderForm() {
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      paymentMethod: "",
      cardNumber: "",
      cardExpiry: "",
      cardCVV: "",
      address: "",
      selectedProducts: [],
      quantities: {},
    },
  });

  // Следим за полями для "живого" предпросмотра
  const paymentMethod = watch("paymentMethod");
  const cardNumberValue = watch("cardNumber");
  const cardExpiryValue = watch("cardExpiry");
  const cardCVVValue = watch("cardCVV");
  const cardType = detectCardType(cardNumberValue);

  const selectedProducts = watch("selectedProducts", []);

  // Сабмит
  const onSubmit = async (data) => {
    console.log("Форма отправлена:", data);
    setPaymentSuccess(false);

    // Эмулируем запрос
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setPaymentSuccess(true);
  };

  return (
    <div style={formStyles.container}>
      <h2 style={formStyles.title}>Оформление заказа</h2>

      {paymentSuccess && (
        <div style={formStyles.successBox}>Оплата прошла успешно!</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 1) Выбор товаров */}
        <div style={formStyles.section}>
          <h4>Выберите товары:</h4>
          <div style={formStyles.productsBlock}>
            {PRODUCTS.map((p) => (
              <div key={p.id} style={formStyles.productItem}>
                <label>
                  <input
                    type="checkbox"
                    value={p.id}
                    {...register("selectedProducts")}
                  />{" "}
                  {p.name}
                </label>
              </div>
            ))}
          </div>

          {selectedProducts.map((productId) => {
            const prod = PRODUCTS.find((x) => x.id === productId);
            return (
              <div key={productId} style={{ marginLeft: 20, marginBottom: 10 }}>
                <label style={formStyles.label}>
                  Количество «{prod?.name}»:
                </label>
                <input
                  type="number"
                  style={formStyles.input}
                  placeholder="1"
                  {...register(`quantities.${productId}`)}
                />
              </div>
            );
          })}
          {errors.quantities && (
            <div style={formStyles.error}>{errors.quantities.message}</div>
          )}
        </div>

        {/* 2) Адрес */}
        <div style={formStyles.section}>
          <label style={formStyles.label}>Адрес доставки:</label>
          <input
            type="text"
            style={formStyles.input}
            placeholder="г. Алматы, ул. Абая, д. 10"
            {...register("address")}
          />
          {errors.address && (
            <div style={formStyles.error}>{errors.address.message}</div>
          )}
        </div>

        {/* 3) Тип оплаты */}
        <div style={formStyles.section}>
          <h4>Тип оплаты:</h4>
          <div>
            <label>
              <input type="radio" value="cash" {...register("paymentMethod")} />{" "}
              Қолма-қол
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                value="online"
                {...register("paymentMethod")}
              />{" "}
              Онлайн төлем
            </label>
          </div>
          <div>
            <label>
              <input type="radio" value="card" {...register("paymentMethod")} />{" "}
              Банктік карта
            </label>
          </div>
          {errors.paymentMethod && (
            <div style={formStyles.error}>{errors.paymentMethod.message}</div>
          )}
        </div>

        {/* 4) Поля карты и "превью" — показываем только если выбрана "card" */}
        {paymentMethod === "card" && (
          <div
            style={{
              ...formStyles.section,
              border: "1px solid #ccc",
              padding: 10,
            }}
          >
            <label style={formStyles.label}>Номер карты (16 цифр):</label>
            <input
              style={formStyles.input}
              placeholder="1234567812345678"
              {...register("cardNumber")}
              maxLength={16}
            />
            {errors.cardNumber && (
              <div style={formStyles.error}>{errors.cardNumber.message}</div>
            )}

            <label style={formStyles.label}>Срок действия (MM/YY):</label>
            <input
              style={formStyles.input}
              placeholder="09/25"
              {...register("cardExpiry")}
              maxLength={5}
            />
            {errors.cardExpiry && (
              <div style={formStyles.error}>{errors.cardExpiry.message}</div>
            )}

            <label style={formStyles.label}>CVV (3 цифры):</label>
            <input
              style={formStyles.input}
              placeholder="123"
              {...register("cardCVV")}
              maxLength={3} // строго 3 цифры
            />
            {errors.cardCVV && (
              <div style={formStyles.error}>{errors.cardCVV.message}</div>
            )}

            {/* Превью карты */}
            <CreditCardPreview
              cardNumber={cardNumberValue}
              cardExpiry={cardExpiryValue}
              cardCVV={cardCVVValue}
              cardType={cardType}
            />
          </div>
        )}

        <button type="submit" style={formStyles.button} disabled={isSubmitting}>
          {isSubmitting ? "Жүктелуде..." : "Жіберу"}
        </button>
      </form>
    </div>
  );
}

// ------------ РЕНДЕР ------------
ReactDOM.render(<OrderForm />, document.getElementById("root"));
