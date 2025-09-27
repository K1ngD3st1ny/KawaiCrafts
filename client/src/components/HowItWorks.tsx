import { Download, FileText, Scissors } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Choose Your Hero",
      description: "Browse our collection of anime papercraft PDFs from your favorite series",
      color: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Download,
      title: "Instant Download", 
      description: "Get immediate access to your PDF files after secure checkout",
      color: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: Scissors,
      title: "Cut, Craft, Collect",
      description: "Print, cut, and assemble your amazing 3D anime figures at home",
      color: "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800",
      iconColor: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <section className="py-16 px-4 bg-card">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-heading font-bold mb-4"
            data-testid="section-title-how-it-works"
          >
            How It Works
          </h2>
          <p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            data-testid="section-description-how-it-works"
          >
            Creating your favorite anime characters has never been easier
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card 
                key={index}
                className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover-elevate"
                data-testid={`card-step-${index + 1}`}
              >
                <CardContent className="p-8 text-center">
                  {/* Step Number */}
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-6`}>
                    <IconComponent className={`w-10 h-10 ${step.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 
                    className="text-xl font-heading font-bold mb-4"
                    data-testid={`text-step-title-${index + 1}`}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="text-muted-foreground leading-relaxed"
                    data-testid={`text-step-description-${index + 1}`}
                  >
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Fun Fact */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground italic">
            🎨 Join thousands of anime fans who have created over 50,000 papercraft figures!
          </p>
        </div>
      </div>
    </section>
  );
}