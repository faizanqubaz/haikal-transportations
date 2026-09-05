export default function AboutPage() {
  return (
    <main>

      <section className="bg-[#f7f8f6] px-5 py-20 sm:px-8 lg:px-12 lg:py-32">

        <div className="mx-auto max-w-7xl">

          <p className="text-xs font-bold tracking-[0.3em] text-teal-700">
            ABOUT HAIKAL TOURS
          </p>

          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-gray-900 sm:text-6xl lg:text-7xl">
            We believe every journey should become a memory.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
            Haikal Tours creates memorable travel experiences,
            comfortable journeys and reliable transportation for
            travelers looking to explore beautiful destinations.
          </p>

        </div>

      </section>


      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">

          <div>
            <img
              src="/images/haikal.png"
              alt="Haikal Tours"
              className="h-[500px] w-full rounded-3xl object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">

            <p className="text-xs font-bold tracking-[0.3em] text-teal-700">
              OUR STORY
            </p>

            <h2 className="mt-4 font-serif text-4xl text-gray-900 sm:text-5xl">
              Travel made simple.
            </h2>

            <p className="mt-6 leading-8 text-gray-600">
              From finding the right bus and selecting your seat
              to discovering new destinations, our goal is to make
              travel simple from beginning to end.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              Whether you are planning a family holiday, an
              adventure through the mountains or a simple transfer,
              Haikal Tours is here to make your journey comfortable.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}