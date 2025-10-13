import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, QrCode, Activity } from 'lucide-react';

export function Tools() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">
          Tools
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Utilities and bulk operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-brand-green" />
            </div>
            <CardTitle>Bulk Import</CardTitle>
            <CardDescription>
              Import multiple agents from CSV or Excel files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Upload File
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-brand-cyan" />
            </div>
            <CardTitle>QR Generator</CardTitle>
            <CardDescription>
              Generate QR codes and ID badges for agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Generate QR
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>
              Run system health checks and diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Run Check
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
