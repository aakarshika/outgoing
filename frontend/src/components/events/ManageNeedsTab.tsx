import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getCategoryLabel, VENDOR_CATEGORIES } from '@/constants/categories';
import {
  useCreateEventNeed,
  useEventNeeds,
  useReviewNeedApplication,
} from '@/features/needs/hooks';
import type { EventNeed, NeedApplication } from '@/types/needs';

export function ManageNeedsTab({
  eventId,
  isSeries,
}: {
  eventId: number;
  isSeries?: boolean;
}) {
  const { data: needsResponse, isLoading } = useEventNeeds(eventId);
  const needs = needsResponse?.data || [];

  const createNeedMutation = useCreateEventNeed();
  const reviewApplicationMutation = useReviewNeedApplication();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [criticality, setCriticality] = useState<
    'essential' | 'replaceable' | 'non_substitutable'
  >('replaceable');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [applyToSeries, setApplyToSeries] = useState(false);

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNeedMutation.mutateAsync({
        eventId,
        payload: {
          title,
          description,
          category,
          criticality,
          budget_min: budgetMin || null,
          budget_max: budgetMax || null,
          update_series: applyToSeries,
        },
      });
      toast.success('Need created successfully!');
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setCategory('');
      setBudgetMin('');
      setBudgetMax('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create need');
    }
  };

  const handleReview = async (
    applicationId: number,
    status: 'accepted' | 'rejected',
  ) => {
    try {
      await reviewApplicationMutation.mutateAsync({ applicationId, status });
      toast.success(`Application ${status}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to review application');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading needs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="flex justify-between items-center "
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        <div>
          <h2
            className="text-xl font-bold flex items-center gap-2"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            <Briefcase className="h-5 w-5 text-gray-800" /> Vendor Needs
          </h2>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
          >
            Manage service requests and vendor applications
          </p>
        </div>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="border-2 border-gray-800 bg-yellow-300 text-gray-900 shadow-[2px_2px_0px_#333] hover:bg-yellow-400 font-bold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Add New Need
          </Button>
        )}
      </div>

      {isCreating && (
        <div
          className="bg-[#fff9e6] border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] mb-6 relative"
          style={{ transform: 'rotate(0.5deg)' }}
        >
          <div className="absolute -top-3 right-6 w-12 h-4 bg-yellow-500/30 border border-yellow-600/20 rotate-12" />
          <h3
            className="text-xl font-bold mb-4"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
          >
            Create New Need
          </h3>
          <form onSubmit={handleCreateNeed} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-1 font-mono text-gray-700">
                  Title (e.g., DJ Required)
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-800 focus:ring-0 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-1 font-mono text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-800 focus:ring-0 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 font-mono text-gray-700">
                  Category *
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-800 focus:ring-0 transition-colors"
                >
                  <option value="">Select a category</option>
                  {VENDOR_CATEGORIES.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 font-mono text-gray-700">
                  Criticality
                </label>
                <select
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value as any)}
                  className="w-full border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-800 focus:ring-0 transition-colors"
                >
                  <option value="essential">Essential</option>
                  <option value="replaceable">Replaceable</option>
                  <option value="non_substitutable">Non-Substitutable</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold mb-1 font-mono text-gray-700">
                    Min Budget ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-800 focus:ring-0 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 font-mono text-gray-700">
                    Max Budget ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-gray-800 focus:ring-0 transition-colors"
                  />
                </div>
              </div>
            </div>

            {isSeries && (
              <div className="flex items-center gap-3 bg-white/50 p-3 rounded border-2 border-dashed border-gray-400">
                <input
                  type="checkbox"
                  id="applyToSeries"
                  checked={applyToSeries}
                  onChange={(e) => setApplyToSeries(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-800 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="applyToSeries"
                  className="font-bold text-gray-800 cursor-pointer select-none"
                  style={{ fontFamily: '"Permanent Marker", cursive' }}
                >
                  Apply to entire series (all draft & published events)
                </label>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreating(false)}
                className="hover:bg-gray-100 font-bold"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createNeedMutation.isPending}
                className="border-2 border-gray-800 bg-blue-400 text-white shadow-[2px_3px_0px_#333] hover:bg-blue-500 font-bold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                {createNeedMutation.isPending ? 'Creating...' : 'Create Need'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {needs.length === 0 ? (
          <div
            className="text-center p-12 bg-white border-2 border-dashed border-gray-400 text-gray-500 font-bold"
            style={{
              fontFamily: '"Caveat", cursive',
              fontSize: '1.5rem',
              transform: 'rotate(-0.5deg)',
            }}
          >
            No needs have been created for this event yet.
          </div>
        ) : (
          needs.map((need: EventNeed, idx: number) => (
            <div
              key={need.id}
              className="bg-white border-2 border-gray-800 p-6 shadow-[3px_4px_0px_#333] relative space-y-4"
              style={{ transform: `rotate(${idx % 2 === 0 ? -0.5 : 0.5}deg)` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="text-xl font-bold text-gray-900"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.8rem' }}
                  >
                    {need.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`px-2 py-0.5 border-2 border-gray-800 text-xs font-bold ${(need.status === 'open' || !need.status || need.status === "pending") ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-900'}`}
                      style={{ fontFamily: '"Permanent Marker", cursive' }}
                    >
                      {need.status.toUpperCase()}
                    </span>
                    <span
                      className="bg-blue-100 border-2 border-gray-800 text-blue-900 px-2 py-0.5 text-xs font-bold"
                      style={{ fontFamily: '"Permanent Marker", cursive' }}
                    >
                      {getCategoryLabel(need.category)}
                    </span>
                    <span
                      className="bg-gray-100 border-2 border-gray-800 text-gray-900 px-2 py-0.5 text-xs font-bold capitalize"
                      style={{ fontFamily: '"Permanent Marker", cursive' }}
                    >
                      {need.criticality.replace('_', '-')}
                    </span>
                    {(need.budget_min || need.budget_max) && (
                      <span
                        className="bg-[#fff9e6] border-2 border-dashed border-gray-600 text-gray-800 px-2 py-0.5 font-bold text-xs"
                        style={{ fontFamily: '"Permanent Marker", cursive' }}
                      >
                        Budget: ${need.budget_min || '0'} - ${need.budget_max || 'Any'}
                      </span>
                    )}
                  </div>
                  {need.description && (
                    <p
                      className="text-sm text-gray-600 mt-3 italic"
                      style={{ fontFamily: 'serif' }}
                    >
                      "{need.description}"
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-sm font-bold text-gray-900 text-center bg-yellow-100 px-4 py-2 border-2 border-gray-800 shadow-[1px_2px_0px_#333] rotate-2">
                    <span
                      className="block text-2xl font-black"
                      style={{ fontFamily: '"Caveat", cursive' }}
                    >
                      {need.application_count}
                    </span>
                    <span
                      style={{
                        fontFamily: '"Permanent Marker", cursive',
                        fontSize: '0.7rem',
                      }}
                    >
                      Applicants
                    </span>
                  </div>
                  {(need.status === 'open' || !need.status || need.status === "pending") && (
                    <Link
                      to={`/vendors?eventId=${eventId}&needId=${need.id}&category=${encodeURIComponent(
                        need.category,
                      )}&needTitle=${encodeURIComponent(need.title)}`}
                      className="text-xs font-bold px-3 py-1.5 border-2 border-gray-800 bg-white text-gray-900 shadow-[1px_1px_0px_#333] hover:bg-gray-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all whitespace-nowrap"
                      style={{
                        fontFamily: '"Permanent Marker", cursive',
                        transform: 'rotate(-1deg)',
                      }}
                    >
                      Invite Vendors
                    </Link>
                  )}
                </div>
              </div>

              {/* Applications List */}
              {need.applications && need.applications.length > 0 && (
                <div className="border-t-2 border-gray-800 border-dashed pt-5 mt-5">
                  <h4
                    className="text-lg font-bold mb-4"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.5rem' }}
                  >
                    Applications
                  </h4>
                  <div className="space-y-4">
                    {need.applications.map((app: NeedApplication, appIdx: number) => (
                      <div
                        key={app.id}
                        className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#fdfdfd] p-4 border-2 border-gray-800 shadow-[2px_2px_0px_#333] relative"
                        style={{
                          transform: `rotate(${appIdx % 2 === 0 ? 0.5 : -0.5}deg)`,
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className="font-bold text-gray-900 text-lg"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                            >
                              {app.vendor_name}
                            </span>
                            <span
                              className={`text-[0.65rem] px-2 py-0.5 border-2 uppercase font-bold ${
                                app.status === 'pending'
                                  ? 'bg-yellow-200 border-yellow-600 text-yellow-900'
                                  : app.status === 'accepted'
                                    ? 'bg-green-200 border-green-600 text-green-900'
                                    : 'bg-red-200 border-red-600 text-red-900'
                              }`}
                              style={{
                                fontFamily: '"Permanent Marker", cursive',
                                transform: 'rotate(-2deg)',
                              }}
                            >
                              {app.status}
                            </span>
                          </div>
                          {app.proposed_price && (
                            <p
                              className="font-bold text-green-700 mb-2"
                              style={{
                                fontFamily: '"Permanent Marker", cursive',
                                fontSize: '0.9rem',
                              }}
                            >
                              Proposed: ${app.proposed_price}
                            </p>
                          )}
                          {app.message && (
                            <p
                              className="text-gray-600 bg-[#fff9e6] p-3 border-2 border-gray-800 text-sm shadow-[1px_1px_0px_#333]"
                              style={{
                                fontFamily: '"Caveat", cursive',
                                fontSize: '1.1rem',
                              }}
                            >
                              "{app.message}"
                            </p>
                          )}
                        </div>

                        {app.status === 'pending' && (need.status === 'open' || !need.status || need.status === "pending") && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-400 hover:bg-green-500 text-gray-900 border-2 border-gray-800 shadow-[1px_2px_0px_#333] font-bold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                              onClick={() => handleReview(app.id, 'accepted')}
                              disabled={reviewApplicationMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> ACCEPT
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-white hover:bg-red-100 text-red-600 border-2 border-gray-800 shadow-[1px_2px_0px_#333] font-bold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
                              style={{ fontFamily: '"Permanent Marker", cursive' }}
                              onClick={() => handleReview(app.id, 'rejected')}
                              disabled={reviewApplicationMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> REJECT
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
